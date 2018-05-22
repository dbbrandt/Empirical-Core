import { Action } from "redux";
import { initState } from "./rootReducer";
import { ActionTypes } from "../actions/actionTypes";

export default (
    currentState = {hasreceiveddata: false},
    action: Action,
) => {
    switch (action.type) {
        case ActionTypes.RECEIVE_GRAMMAR_ACTIVITY_DATA:
            return Object.assign({}, currentState, { currentActivity: action.data}, {hasreceiveddata: true});
        default:
            return currentState;
    }
};