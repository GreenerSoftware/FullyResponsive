import process from 'node:process';
import { type Request } from '@hapi/hapi';
import { Request as ScloudRequest, Response as ScloudResponse } from '@scloud/lambda-api/dist/types';
import { type Errors } from '../view-model';
import { ReturnState, type ReturnDecision } from '../../return-state';
import { type Controller } from '../../controller';
import { type ApplicationModel } from '../../application-model';
import { type ApplicationConfig } from '../../application-config';
import { slackLog } from 'helpers/slack';

type FormData = {
  confirm: string;
};

const errorChecker = (request: Request): Errors | undefined => {
  const formData = request.payload as FormData;

  if (formData.confirm !== 'yes') {
    return {
      confirmIncorrectValue: true,
    };
  }

  return undefined;
};
const scloudErrorChecker = (request: ScloudRequest): Errors | undefined => {
  const formData = request.body as FormData;

  if (formData.confirm !== 'yes') {
    return {
      confirmIncorrectValue: true,
    };
  }

  return undefined;
};

const handler = async (request: Request, config: ApplicationConfig): Promise<ReturnDecision> => {
  const errors = errorChecker(request);

  if (errors) {
    return { state: ReturnState.ValidationError };
  }

  let model = (request.yar.get('applicationModel') ?? {}) as ApplicationModel;

  let returnsResponse;
  try {
    returnsResponse = await fetch(`${config.apiEndpoint}/returns/property-return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(model),
    });

    model = {};
    // // Save the confirmed property code to the now empty model.
    // model.propertyCodeConfirmation = returnsResponse.data.propertyCode as string;
    console.log(returnsResponse);

    // Save the application model to session storage.
    request.yar.set('applicationModel', model);
  } catch {
    // If something went wrong with the API call return an error object with the view model.
    const apiError = true;
    const errors: Errors = {
      apiError,
    };

    // Tell the visitor if there are any errors.
    if (errors && !process.env.UNDER_TEST) {
      return { state: ReturnState.ValidationError };
    }
  }

  // Clear the previous pages
  request.yar.set('previousPages', []);

  return { state: ReturnState.Primary };
};

const scloudHandler = async (request: ScloudRequest, response: ScloudResponse, config: ApplicationConfig): Promise<ReturnDecision> => {
  const get = request.context.sessionGet as <T>(key: string) => Promise<T>;
  const set = request.context.sessionSet as <T>(key: string, value: T, response: ScloudResponse) => Promise<void>;

  const errors = scloudErrorChecker(request);

  if (errors) {
    return { state: ReturnState.ValidationError };
  }

  let model = (await get('applicationModel') ?? {}) as ApplicationModel;

  let returnsResponse;
  try {
    await slackLog('check-your-answers applicationModel: fetching', `${config.apiEndpoint}/returns/property-return`, 'with', JSON.stringify(await get<ApplicationModel>('applicationModel')));
    returnsResponse = await fetch(`${config.apiEndpoint}/returns/property-return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(model),
    });

    const result = await returnsResponse.json();
    await slackLog('check-your-answers applicationModel: result', JSON.stringify(result));
    set('applicationId', result.id, response);

    model = {};
    // // Save the confirmed property code to the now empty model.
    // model.propertyCodeConfirmation = returnsResponse.data.propertyCode as string;
    console.log(returnsResponse);

    // Save the application model to session storage.
    await set('applicationModel', model, response);
  } catch (e) {
    await slackLog('check-your-answers applicationModel: error', `${e}`);
    // If something went wrong with the API call return an error object with the view model.
    const apiError = true;
    const errors: Errors = {
      apiError,
    };

    // Tell the visitor if there are any errors.
    if (errors && !process.env.UNDER_TEST) {
      return { state: ReturnState.ValidationError };
    }
  }

  // Clear the previous pages
  await set('previousPages', [], response);

  return { state: ReturnState.Primary };
};

/**
 * The full controller object.
 */
const controller: Controller = {
  checkErrors: errorChecker,
  scloudCheckErrors: scloudErrorChecker,
  handle: handler,
  scloudHandle: scloudHandler,
};

export default controller;
