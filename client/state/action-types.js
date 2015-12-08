/**
 * Any new action type should be added to the set of exports below, with the
 * value mirroring its exported name.
 *
 * Please keep this list alphabetized!
 */

export const COMPLETE_EXPORT = 'COMPLETE_EXPORT';
export const FAIL_EXPORT = 'FAIL_EXPORT';
export const FAIL_PUBLICIZE_CONNECTIONS_REQUEST = 'FAIL_PUBLICIZE_CONNECTIONS_REQUEST';
export const FETCH_EXPORTER_ADVANCED_SETTINGS = 'FETCH_EXPORTER_ADVANCED_SETTINGS';
export const FETCH_PUBLICIZE_CONNECTIONS = 'FETCH_PUBLICIZE_CONNECTIONS';
export const FETCH_SITE_PLANS = 'FETCH_SITE_PLANS';
export const FETCH_SITE_PLANS_COMPLETED = 'FETCH_SITE_PLANS_COMPLETED';
export const NEW_NOTICE = 'NEW_NOTICE';
export const RECEIVE_EXPORTER_ADVANCED_SETTINGS = 'RECEIVE_EXPORTER_ADVANCED_SETTINGS';
export const RECEIVE_PUBLICIZE_CONNECTIONS = 'RECEIVE_PUBLICIZE_CONNECTIONS';
export const RECEIVE_SITE = 'RECEIVE_SITE';
export const REMOVE_NOTICE = 'REMOVE_NOTICE';
export const REMOVE_SITE_PLANS = 'REMOVE_SITE_PLANS';
export const SET_EXPORT_POST_TYPE = 'SET_EXPORT_POST_TYPE';
export const SET_EXPORTER_ADVANCED_SETTING = 'SET_EXPORTER_ADVANCED_SETTING';
export const SET_SECTION = 'SET_SECTION';
export const SET_SELECTED_SITE = 'SET_SELECTED_SITE';

// TODO: Should these be renamed FETCH_ and RECEIVE_ to conform to the above?
// FETCH and RECEIVE doesn't really match the meaning of the request, since
// we're not fetching anything - rather we're just triggering an async export
// and waiting to hear whether it was successfully started
export const REQUEST_START_EXPORT = 'REQUEST_START_EXPORT';
export const REPLY_START_EXPORT = 'REPLY_START_EXPORT';
