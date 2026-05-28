import { placeTile, selectTile, advanceRound, autoPlace } from './engine.js';

export const ACTIONS = {
  PLACE_TILE: 'PLACE_TILE',
  SELECT_TILE: 'SELECT_TILE',
  SET_STATE: 'SET_STATE',
  ADVANCE_ROUND: 'ADVANCE_ROUND',
  AUTO_PLACE: 'AUTO_PLACE',
  RESET_GAME: 'RESET_GAME',
};

export function gameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.PLACE_TILE:
      return placeTile(state, action.circleIndex, action.tileValue);

    case ACTIONS.SELECT_TILE:
      return selectTile(state, action.tileValue);

    case ACTIONS.SET_STATE:
      return { ...action.state };

    case ACTIONS.ADVANCE_ROUND:
      return advanceRound(state);

    case ACTIONS.AUTO_PLACE:
      return autoPlace(state);

    case ACTIONS.RESET_GAME:
      return action.state;

    default:
      return state;
  }
}
