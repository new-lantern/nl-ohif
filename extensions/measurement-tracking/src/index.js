import getContextModule from './getContextModule.js';
import getPanelModule from './getPanelModule.js';
import getViewportModule from './getViewportModule.js';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'org.ohif.measurement-tracking',
  getContextModule,
  getPanelModule,
  getViewportModule,
  getCommandsModule({ servicesManager }) {
    return {
      definitions: {
        setToolActive: {
          commandFn: ({ toolName, element, disabled }) => {
            if (!toolName) {
              console.warn('No toolname provided to setToolActive command');
            }

            console.log(disabled, toolName);
            // Set same tool or alt tool
            if (!disabled) {
              cornerstoneTools.setToolActiveForElement(element, toolName, {
                mouseButtonMask: 1,
              });
            } else {
              cornerstoneTools.setToolDisabled(toolName);
              element.style.cursor = 'initial';
            }
          },
          storeContexts: [],
          options: {},
        },
      },
      defaultContext: 'ACTIVE_VIEWPORT::TRACKED',
    };
  },
};
