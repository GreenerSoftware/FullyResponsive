import { type Request } from '@hapi/hapi';
import { Request as ScloudRequest, Response as ScloudResponse } from '@scloud/lambda-api/dist/types';
import { type ApplicationModel } from 'application-model';
import { type ApplicationConfig } from 'application-config';
import { type ReturnDecision, ReturnState } from '../../return-state';
import { type Errors } from '../view-model';
import { type Controller } from '../../controller';
import { validationUtils } from '../../utils/validation';
import { formUtils } from '../../utils/form';

interface FormData {
  name: string;
  organisation: string;
  emailAddress: string;
  phoneNumber: string;
}

const errorChecker = (request: Request): Errors | undefined => {
  // Grab the form as a json object.
  const formData = request.payload as FormData;

  const name = formUtils.cleanInputString(formData.name ?? undefined);
  const emailAddress = formUtils.cleanInputString(formData.emailAddress ?? undefined);
  const phoneNumber = formUtils.cleanInputString(formData.phoneNumber ?? undefined);

  const missingNameValue = name === undefined;
  const invalidNameValue = !missingNameValue && !validationUtils.firstAndLastNameGiven(name);

  const missingEmailAddressValue = emailAddress === undefined;
  const invalidEmailAddressValue = !missingEmailAddressValue && !validationUtils.validEmailAddress(emailAddress);

  // Telephone number is optional, but if we have one validate it looks correct.
  let invalidPhoneNumberValue = false;
  if (phoneNumber) {
    invalidPhoneNumberValue = !validationUtils.validPhoneNumber(phoneNumber);
  }

  if (
    missingNameValue ||
    invalidNameValue ||
    missingEmailAddressValue ||
    invalidEmailAddressValue ||
    invalidPhoneNumberValue
  ) {
    const errors: Errors = {
      missingNameValue,
      invalidNameValue,
      missingEmailAddressValue,
      invalidEmailAddressValue,
      invalidPhoneNumberValue,
    };

    return errors;
  }

  return undefined;
};

const scloudErrorChecker = (request: ScloudRequest): Errors | undefined => {
  // Grab the form as a json object.
  const formData = request.body as FormData;

  const name = formUtils.cleanInputString(formData.name ?? undefined);
  const emailAddress = formUtils.cleanInputString(formData.emailAddress ?? undefined);
  const phoneNumber = formUtils.cleanInputString(formData.phoneNumber ?? undefined);

  const missingNameValue = name === undefined;
  const invalidNameValue = !missingNameValue && !validationUtils.firstAndLastNameGiven(name);

  const missingEmailAddressValue = emailAddress === undefined;
  const invalidEmailAddressValue = !missingEmailAddressValue && !validationUtils.validEmailAddress(emailAddress);

  // Telephone number is optional, but if we have one validate it looks correct.
  let invalidPhoneNumberValue = false;
  if (phoneNumber) {
    invalidPhoneNumberValue = !validationUtils.validPhoneNumber(phoneNumber);
  }

  if (
    missingNameValue ||
    invalidNameValue ||
    missingEmailAddressValue ||
    invalidEmailAddressValue ||
    invalidPhoneNumberValue
  ) {
    const errors: Errors = {
      missingNameValue,
      invalidNameValue,
      missingEmailAddressValue,
      invalidEmailAddressValue,
      invalidPhoneNumberValue,
    };

    return errors;
  }

  return undefined;
};

const handler = async (request: Request, config: ApplicationConfig): Promise<ReturnDecision> => {
  const formData = request.payload as FormData;

  const model = (request.yar.get('applicationModel') ?? {}) as ApplicationModel;

  model.applicantName = formUtils.cleanInputString(formData.name ?? undefined);
  model.applicantOrganisation = formUtils.cleanInputString(formData.organisation ?? undefined);
  model.applicantEmailAddress = formUtils.cleanInputString(formData.emailAddress ?? undefined);
  model.applicantPhoneNumber = formUtils.cleanInputString(formData.phoneNumber ?? undefined);

  request.yar.set('applicationModel', model);

  const hasErrors = errorChecker(request);

  if (hasErrors) {
    return { state: ReturnState.ValidationError };
  }

  return { state: ReturnState.Primary };
};

const scloudHandler = async (request: ScloudRequest, response: ScloudResponse, config: ApplicationConfig): Promise<ReturnDecision> => {
  const get = request.context.sessionGet as <T>(key: string) => Promise<T>;
  const set = request.context.sessionSet as <T>(key: string, value: T, response: ScloudResponse) => Promise<void>;

  const formData = request.body as FormData;

  const model = (await get('applicationModel') ?? {}) as ApplicationModel;

  model.applicantName = formUtils.cleanInputString(formData.name ?? undefined);
  model.applicantOrganisation = formUtils.cleanInputString(formData.organisation ?? undefined);
  model.applicantEmailAddress = formUtils.cleanInputString(formData.emailAddress ?? undefined);
  model.applicantPhoneNumber = formUtils.cleanInputString(formData.phoneNumber ?? undefined);

  await set('applicationModel', model, response);

  const hasErrors = scloudErrorChecker(request);

  if (hasErrors) {
    return { state: ReturnState.ValidationError };
  }

  return { state: ReturnState.Primary };
};

/**
 * The full controller object.
 */
const whatIsYourEmailController: Controller = {
  checkErrors: errorChecker,
  scloudCheckErrors: scloudErrorChecker,
  handle: handler,
  scloudHandle: scloudHandler,
};

export { whatIsYourEmailController };
