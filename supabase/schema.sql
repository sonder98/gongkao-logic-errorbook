-- 在 Supabase SQL Editor 中执行。
-- 题目本身保留在网页里，云端仅存当前用户的答题状态与个人笔记。

create table if not exists public.question_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- 兼容已经执行过旧版 SQL 的项目。
alter table public.question_progress
  add column if not exists version bigint not null default 1;

create or replace function public.set_question_progress_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_question_progress_updated_at
  on public.question_progress;
create trigger set_question_progress_updated_at
before update on public.question_progress
for each row execute function public.set_question_progress_updated_at();

alter table public.question_progress enable row level security;
revoke all on public.question_progress from anon, authenticated;
grant select, insert, update, delete on public.question_progress to authenticated;

drop policy if exists "read_own_progress" on public.question_progress;
create policy "read_own_progress" on public.question_progress
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "insert_own_progress" on public.question_progress;
create policy "insert_own_progress" on public.question_progress
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "update_own_progress" on public.question_progress;
create policy "update_own_progress" on public.question_progress
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "delete_own_progress" on public.question_progress;
create policy "delete_own_progress" on public.question_progress
for delete to authenticated
using ((select auth.uid()) = user_id);

-- 乐观并发写入：只有客户端持有的版本与云端一致时才更新。
-- 版本不一致时返回 conflict=true 和当前云端数据，避免静默覆盖另一台设备的修改。
create or replace function public.save_question_progress(
  p_question_id text,
  p_data jsonb,
  p_expected_version bigint default null
)
returns table (
  question_id text,
  data jsonb,
  version bigint,
  updated_at timestamptz,
  conflict boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.question_progress%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_question_id is null or length(trim(p_question_id)) = 0 then
    raise exception 'question_id is required';
  end if;

  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    raise exception 'data must be a JSON object';
  end if;

  select qp.*
    into v_row
    from public.question_progress as qp
   where qp.user_id = v_user_id
     and qp.question_id = p_question_id
   for update;

  if not found then
    begin
      insert into public.question_progress (user_id, question_id, data, version)
      values (v_user_id, p_question_id, p_data, 1)
      returning * into v_row;
    exception when unique_violation then
      -- 两台设备首次同时保存同一题时，另一事务可能抢先插入。
      select qp.*
        into v_row
        from public.question_progress as qp
       where qp.user_id = v_user_id
         and qp.question_id = p_question_id
       for update;

      return query
        select v_row.question_id, v_row.data, v_row.version,
               v_row.updated_at, true;
      return;
    end;

    return query
      select v_row.question_id, v_row.data, v_row.version,
             v_row.updated_at, false;
    return;
  end if;

  if p_expected_version is null or v_row.version <> p_expected_version then
    return query
      select v_row.question_id, v_row.data, v_row.version,
             v_row.updated_at, true;
    return;
  end if;

  update public.question_progress as qp
     set data = p_data,
         version = qp.version + 1
   where qp.user_id = v_user_id
     and qp.question_id = p_question_id
  returning qp.* into v_row;

  return query
    select v_row.question_id, v_row.data, v_row.version,
           v_row.updated_at, false;
end;
$$;

revoke all on function public.save_question_progress(text, jsonb, bigint)
  from public, anon;
grant execute on function public.save_question_progress(text, jsonb, bigint)
  to authenticated;

-- 验收时请再使用两个不同账号验证：
-- 1. A 无法读取/修改/删除 B 的行；
-- 2. 匿名用户无法访问表或调用保存函数；
-- 3. 同一题以旧 version 保存时返回 conflict=true。
