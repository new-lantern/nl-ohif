import { hotkeysValidators } from './hotkeysValidators';

/**
 * Split hotkeys definitions and create hotkey related tuples
 *
 * @param {array} hotkeyDefinitions
 * @returns {array} array of tuples consisted of command name and hotkey definition
 */
const splitHotkeyDefinitionsAndCreateTuples = hotkeyDefinitions => {
  const splitedHotkeys = [];
  const arrayHotkeys = Object.entries(hotkeyDefinitions);

  if (arrayHotkeys.length) {
    const halfwayThrough = Math.ceil(arrayHotkeys.length / 2);
    splitedHotkeys.push(arrayHotkeys.slice(0, halfwayThrough));
    splitedHotkeys.push(
      arrayHotkeys.slice(halfwayThrough, arrayHotkeys.length)
    );
  }

  return splitedHotkeys;
};

/**
 * Remove validation errors as necessary
 *
 * @param {Object} currentErrors
 * @param {array} pressedKeys new keys
 * @param {string} id id
 * @param {array} arguments.hotkeys current hotkeys
 * @returns {Object} {error} validation error
 */
const removeErrors = (currentErrors, pressedKeys, id, hotkeys) => {
  const pressedLabel = hotkeys[id].label;
  let newLabel;
  if (Object.keys(currentErrors.currentErrors).length) {
    // First delete the error once we correctly update the hotkey
    Object.keys(currentErrors.currentErrors).every(key => {
      if (currentErrors.currentErrors[key]['error']) {
        const errorLabel = currentErrors.currentErrors[key]['label'];
        const errorKeys = currentErrors.currentErrors[key]['keys'];
        if (
          errorLabel === pressedLabel &&
          pressedKeys.join('+') !== errorKeys
        ) {
          newLabel = hotkeys[key].label;
          currentErrors.currentErrors[key]['error'] = undefined;
          return false;
        }
      }
      return true;
    });
    // Then we relabel old errors so that all duplicate keys have the same error
    Object.keys(currentErrors.currentErrors).forEach(key => {
      const error = currentErrors.currentErrors[key]['error'];
      if (error) {
        const errorLabel = currentErrors.currentErrors[key]['label'];
        const errorKeys = currentErrors.currentErrors[key]['keys'];
        if (
          errorLabel === pressedLabel &&
          pressedKeys.join('+') !== errorKeys
        ) {
          currentErrors.currentErrors[key]['label'] = newLabel;
        }
      }
    });
  }

  return { currentErrors: currentErrors };
};

/**
 * Validate a hotkey change
 *
 * @param {Object} arguments
 * @param {string} arguments.commandName command name or id
 * @param {array} arguments.pressedKeys new keys
 * @param {array} arguments.hotkeys current hotkeys
 * @param {Object} currentErrors
 * @returns {Object} {error} validation error
 */
const validate = ({ commandName, pressedKeys, hotkeys, currentErrors }) => {
  const updatedErrors = removeErrors(
    currentErrors,
    pressedKeys,
    commandName,
    hotkeys
  );
  for (const validator of hotkeysValidators) {
    const validation = validator({
      commandName,
      pressedKeys,
      hotkeys,
    });
    if (validation && validation.error) {
      return { ...validation, ...updatedErrors };
    }
  }
  return { error: undefined, ...updatedErrors };
};

export { validate, splitHotkeyDefinitionsAndCreateTuples };
