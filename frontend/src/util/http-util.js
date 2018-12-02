// @flow strict

import { firebaseUserPromise } from './firebase-util';

/**
 * Send a GET request to the given endPoint and returns the promise of response.
 *
 * @param {string} endPoint the endpoint auto prefixed with '/api'.
 * @return {Promise<T>} the promise of the result.
 */
export async function get<T>(endPoint: string): Promise<T> {
  const user = await firebaseUserPromise();
  if (user == null) {
    throw new Error('The user has not logged in yet.');
  }
  const result = await fetch(`/api${endPoint}?token=${user.token}`);
  return result.json();
}

/**
 * Send a request to the given endPoint with data, and returns the promise of response.
 *
 * @param {'POST'|'PUT'} method the method to use.
 * @param {string} endPoint the endpoint auto prefixed with '/api'.
 * @param {Object} data the data sent to the server.
 * @return {Promise<T>} the promise of the result.
 */
async function sendData<T>(method: 'POST' | 'PUT', endPoint: string, data: Object): Promise<T> {
  const user = await firebaseUserPromise();
  if (user == null) {
    throw new Error('The user has not logged in yet.');
  }
  const { token } = user;
  const result = await fetch(`/api${endPoint}`, {
    method,
    body: JSON.stringify({ ...data, token }),
  });
  return result.json();
}

/**
 * Send a POST request to the given endPoint and data, and returns the promise of response.
 *
 * @param {string} endPoint the endpoint auto prefixed with '/api'.
 * @param {Object} data the data sent to the server.
 * @return {Promise<T>} the promise of the result.
 */
export async function post<T>(endPoint: string, data: Object = {}): Promise<T> {
  return sendData('POST', endPoint, data);
}

/**
 * Send a PUT request to the given endPoint and data, and returns the promise of response.
 *
 * @param {string} endPoint the endpoint auto prefixed with '/api'.
 * @param {Object} data the data sent to the server.
 * @return {Promise<T>} the promise of the result.
 */
export async function put<T>(endPoint: string, data: Object = {}): Promise<T> {
  return sendData('PUT', endPoint, data);
}