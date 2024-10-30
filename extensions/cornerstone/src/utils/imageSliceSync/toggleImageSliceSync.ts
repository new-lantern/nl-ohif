const IMAGE_SLICE_SYNC_NAME = 'IMAGE_SLICE_SYNC';

export default function toggleImageSliceSync({
  servicesManager,
  viewports: providedViewports,
  syncId,
}) {
  const { syncGroupService, viewportGridService, displaySetService, cornerstoneViewportService } =
    servicesManager.services;

  syncId ||= IMAGE_SLICE_SYNC_NAME;

  const viewports = getReconstructableStackViewports(viewportGridService, displaySetService);

  const someViewportHasSync = viewports.some(viewport => {
    const syncStates = syncGroupService.getSynchronizersForViewport(
      viewport.viewportOptions.viewportId
    );

    const imageSync = syncStates.find(syncState => syncState.id === syncId);

    return !!imageSync;
  });

  if (someViewportHasSync) {
    return disableSync(syncId, servicesManager);
  }

  // create synchronization group and add the viewports to it.
  viewports.forEach(gridViewport => {
    const { viewportId } = gridViewport.viewportOptions;
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    if (!viewport) {
      return;
    }
    syncGroupService.addViewportToSyncGroup(viewportId, viewport.getRenderingEngine().id, {
      type: 'stackimage',
      id: IMAGE_SLICE_SYNC_NAME,
      source: true,
      target: true,
    });
  });
}

function disableSync(syncName, servicesManager) {
  const { syncGroupService, viewportGridService, displaySetService, cornerstoneViewportService } =
    servicesManager.services;
  const viewports = getReconstructableStackViewports(viewportGridService, displaySetService);
  viewports.forEach(gridViewport => {
    const { viewportId } = gridViewport.viewportOptions;
    const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    if (!viewport) {
      return;
    }
    syncGroupService.removeViewportFromSyncGroup(
      viewport.id,
      viewport.getRenderingEngine().id,
      syncName
    );
  });
}

/**
 * Gets the consistent spacing stack viewport types, which are the ones which
 * can be navigated using the stack image sync right now.
 */
export function getReconstructableStackViewports(viewportGridService, displaySetService) {
  let { viewports } = viewportGridService.getState();

  viewports = [...viewports.values()];
  // filter empty viewports
  viewports = viewports.filter(
    viewport => viewport.displaySetInstanceUIDs && viewport.displaySetInstanceUIDs.length
  );

  return viewports;
}
