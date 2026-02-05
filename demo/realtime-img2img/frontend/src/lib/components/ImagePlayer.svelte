<script lang="ts">
  import { lcmLiveStatus, LCMLiveStatus, streamId, frameTick, aiFps } from '$lib/lcmLive';
  import { getPipelineValues } from '$lib/store';

  import Button from '$lib/components/Button.svelte';
  import Floppy from '$lib/icons/floppy.svelte';
  import { snapImage } from '$lib/utils';

  $: isLCMRunning = $lcmLiveStatus !== LCMLiveStatus.DISCONNECTED;
  $: console.log('isLCMRunning', isLCMRunning);
  import { onDestroy, onMount } from 'svelte';

  let imageEl: HTMLImageElement;
  let containerEl: HTMLDivElement;
  let isFullscreen = false;
  let showFps = true;
  $: fps = Math.round($aiFps || 0);

  async function toggleFullscreen() {
    if (!containerEl) return;
    if (!document.fullscreenElement) {
      await containerEl.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  function handleFullscreenChange() {
    isFullscreen = !!document.fullscreenElement;
  }

  let unsubscribeStatus: (() => void) | null = null;

  onMount(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    unsubscribeStatus = lcmLiveStatus.subscribe((status) => {
      if (status === LCMLiveStatus.DISCONNECTED) {
        // aiFps resets via store in lcmLive
      }
    });
  });

  onDestroy(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    if (unsubscribeStatus) {
      unsubscribeStatus();
    }
  });
  async function takeSnapshot() {
    if (isLCMRunning) {
      await snapImage(imageEl, {
        prompt: getPipelineValues()?.prompt,
        negative_prompt: getPipelineValues()?.negative_prompt,
        seed: getPipelineValues()?.seed,
        guidance_scale: getPipelineValues()?.guidance_scale
      });
    }
  }
</script>

<div
  bind:this={containerEl}
  class={`relative mx-auto self-center overflow-hidden border border-slate-300 ${
    isFullscreen
      ? 'h-screen w-screen bg-black flex items-center justify-center'
      : 'aspect-square max-w-lg rounded-lg'
  }`}
>
  <!-- svelte-ignore a11y-missing-attribute -->
  {#if isLCMRunning && $streamId}
    <img
      bind:this={imageEl}
      class={isFullscreen ? 'h-full w-auto' : 'aspect-square w-full rounded-lg'}
      src={'/api/stream/' + $streamId}
    />
    {#if showFps}
      <div class="absolute top-1 left-1 rounded bg-black/60 px-2 py-1 text-xs text-white">
        {fps} fps
      </div>
    {/if}
    {#if !isFullscreen}
      <div class="absolute top-1 right-1 flex gap-1">
        <Button
          on:click={() => (showFps = !showFps)}
          title={showFps ? 'Hide FPS' : 'Show FPS'}
          classList={'text-sm ml-auto text-white p-1 shadow-lg rounded-lg opacity-50'}
        >
          FPS
        </Button>
        <Button
          on:click={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          classList={'text-sm ml-auto text-white p-1 shadow-lg rounded-lg opacity-50'}
        >
          {#if isFullscreen}
            Exit
          {:else}
            Fullscreen
          {/if}
        </Button>
      </div>
      <div class="absolute bottom-1 right-1">
        <Button
          on:click={takeSnapshot}
          disabled={!isLCMRunning}
          title={'Take Snapshot'}
          classList={'text-sm ml-auto text-white p-1 shadow-lg rounded-lg opacity-50'}
        >
          <Floppy classList={''} />
        </Button>
      </div>
    {/if}
  {:else}
    <img
      class="aspect-square w-full rounded-lg"
      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    />
  {/if}
</div>
