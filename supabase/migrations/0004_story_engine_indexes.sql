-- Query performance and current-bible invariant for the Studio writing workflow.

create unique index if not exists story_bibles_one_current_per_series
  on public.story_bibles(series_id)
  where is_current = true;

create index if not exists scripts_episode_version_desc_idx
  on public.scripts(episode_id, version desc);

create index if not exists scenes_episode_scene_number_idx
  on public.scenes(episode_id, scene_number);

create index if not exists production_jobs_owner_task_created_idx
  on public.production_jobs(owner_id, task_type, created_at desc);
