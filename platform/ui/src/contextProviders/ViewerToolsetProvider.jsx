import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import PropTypes from 'prop-types';

const DEFAULT_STATE = {
  isReferenceLinesEnabled: false,
  isSeriesLinkingEnabled: false,
};

export const ViewerToolsetContext = createContext(DEFAULT_STATE);

export default function ViewerToolsetProvider({ children, service }) {
  const reducer = (state, action) => {
    switch (action.type) {
      case 'SET_IS_REFERENCE_LINES_ENABLED': {
        return { ...state, ...{ isReferenceLinesEnabled: action.payload } };
      }
      case 'SET_IS_SERIES_LINKING_ENABLED': {
        return { ...state, ...{ isSeriesLinkingEnabled: action.payload } };
      }
      default:
        return action.payload;
    }
  };

  const [state, dispatch] = useReducer(
    reducer,
    DEFAULT_STATE
  );

  const getState = useCallback(() => state, [state]);

  const setIsReferenceLinesEnabled = useCallback(
    isReferenceLinesEnabled => dispatch({ type: 'SET_IS_REFERENCE_LINES_ENABLED', payload: isReferenceLinesEnabled }),
    [dispatch]
  );

  const setIsSeriesLinkingEnabled = useCallback(
    isSeriesLinkingEnabled => dispatch({ type: 'SET_IS_SERIES_LINKING_ENABLED', payload: isSeriesLinkingEnabled }),
    [dispatch]
  );

  /**
   * Sets the implementation of a modal service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ getState, setIsReferenceLinesEnabled, setIsSeriesLinkingEnabled });
    }
  }, [
    getState,
    service,
    setIsReferenceLinesEnabled,
    setIsSeriesLinkingEnabled,
  ]);

  const api = {
    getState,
    setIsReferenceLinesEnabled,
    setIsSeriesLinkingEnabled,
  };

  return (
    <ViewerToolsetContext.Provider value={[state, api]}>
      {children}
    </ViewerToolsetContext.Provider>
  );
}

ViewerToolsetProvider.propTypes = {
  children: PropTypes.any,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }).isRequired,
};

export const useViewerToolset = () => useContext(ViewerToolsetContext);