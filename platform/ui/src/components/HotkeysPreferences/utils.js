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
 * Validate a hotkey change
 *
 * @param {Object} arguments
 * @param {string} arguments.commandName command name or id
 * @param {array} arguments.pressedKeys new keys
 * @param {array} arguments.hotkeys current hotkeys
 * @returns {Object} {error} validation error
 */
const validate = ({ commandName, pressedKeys, hotkeys }) => {
  for (const validator of hotkeysValidators) {
    const validation = validator({
      commandName,
      pressedKeys,
      hotkeys,
    });

    if (validation && validation.error) {
      console.log('VERROR', validation);
      return validation;
    }
  }
  return { error: undefined };
};

/**
 * Extract relevant toolName and key data from a validation error
 *
 * @param {Object} error {error}
 * @returns {array} [toolName, key] toolName and key from error
 */
const extractInfoFromError = error => {
  const regex = /"([^"]+)"[^"]+"([^"]+)"/;
  const match = error.match(regex);
  if (match !== null) {
    const toolName = match[1];
    const key = match[2];
    return [toolName, key];
  } else {
    return null;
  }
};

export { validate, splitHotkeyDefinitionsAndCreateTuples, extractInfoFromError };
