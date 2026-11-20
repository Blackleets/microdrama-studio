-- Tighten cross-record ownership and prevent self-assigned profile roles.
drop policy if exists profiles_update_own on public.profiles;

drop policy if exists approvals_owner_all on public.approvals;
create policy approvals_owner_all on public.approvals
for all using (
  owner_id = auth.uid()
  and exists (
    select 1 from public.episodes e
    join public.series s on s.id = e.series_id
    where e.id = episode_id and s.owner_id = auth.uid()
  )
)
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.episodes e
    join public.series s on s.id = e.series_id
    where e.id = episode_id and s.owner_id = auth.uid()
  )
);

drop policy if exists jobs_owner_all on public.production_jobs;
create policy jobs_owner_all on public.production_jobs
for all using (
  owner_id = auth.uid()
  and (series_id is null or exists(select 1 from public.series s where s.id=series_id and s.owner_id=auth.uid()))
  and (episode_id is null or exists(select 1 from public.episodes e join public.series s on s.id=e.series_id where e.id=episode_id and s.owner_id=auth.uid()))
  and (scene_id is null or exists(select 1 from public.scenes sc join public.episodes e on e.id=sc.episode_id join public.series s on s.id=e.series_id where sc.id=scene_id and s.owner_id=auth.uid()))
)
with check (
  owner_id = auth.uid()
  and (series_id is null or exists(select 1 from public.series s where s.id=series_id and s.owner_id=auth.uid()))
  and (episode_id is null or exists(select 1 from public.episodes e join public.series s on s.id=e.series_id where e.id=episode_id and s.owner_id=auth.uid()))
  and (scene_id is null or exists(select 1 from public.scenes sc join public.episodes e on e.id=sc.episode_id join public.series s on s.id=e.series_id where sc.id=scene_id and s.owner_id=auth.uid()))
);

drop policy if exists assets_owner_all on public.media_assets;
create policy assets_owner_all on public.media_assets
for all using (
  owner_id = auth.uid()
  and (series_id is null or exists(select 1 from public.series s where s.id=series_id and s.owner_id=auth.uid()))
  and (episode_id is null or exists(select 1 from public.episodes e join public.series s on s.id=e.series_id where e.id=episode_id and s.owner_id=auth.uid()))
  and (scene_id is null or exists(select 1 from public.scenes sc join public.episodes e on e.id=sc.episode_id join public.series s on s.id=e.series_id where sc.id=scene_id and s.owner_id=auth.uid()))
)
with check (
  owner_id = auth.uid()
  and (series_id is null or exists(select 1 from public.series s where s.id=series_id and s.owner_id=auth.uid()))
  and (episode_id is null or exists(select 1 from public.episodes e join public.series s on s.id=e.series_id where e.id=episode_id and s.owner_id=auth.uid()))
  and (scene_id is null or exists(select 1 from public.scenes sc join public.episodes e on e.id=sc.episode_id join public.series s on s.id=e.series_id where sc.id=scene_id and s.owner_id=auth.uid()))
);
