import { type Request } from '@hapi/hapi';
import { Request as ScloudRequest } from '@scloud/lambda-api/dist/types';
import { type ApplicationModel } from '../../application-model';
import { type ApplicationConfig } from '../../application-config';
import { scloudViewModelBuilder, viewModelBuilder, type Errors, type ViewModel } from '../view-model';
import { checkYourAnswersAnnual, whatIsYourEmail } from '../page-urls';

type PageViewModel = Record<string, unknown> & ViewModel;

const createChangeLink = (pageUrl: string, extraQueryParameters: Iterable<[string, string]> = []) => {
  const trimmedPageUrl = pageUrl.slice(1);
  const trimmedCheckYourAnswersUrl = checkYourAnswersAnnual.slice(1);
  const queryParameters = new URLSearchParams([
    ['action', 'back'],
    ['backPage', trimmedCheckYourAnswersUrl],
    ...extraQueryParameters,
  ]);
  return `${trimmedPageUrl}?${queryParameters.toString()}`;
};

/**
 * Build our 'PageViewModel' from the 'ApplicationModel'.
 * @param {Request} request The request.
 * @param {string | undefined} backUrl Where should the browser take the
 * visitor when they click the '< Back' link?
 * @param {ApplicationModel} model The 'ApplicationModel' used to build this
 * 'ViewModel'. We're not actually interested in any fields for this page.
 * @param {ApplicationConfig} config Our application's configuration.
 * @param {Errors | undefined} error Represents whether the controller found
 * any errors in a submission and is requesting a redisplay with appropriate
 * error messages.
 * @returns {Promise<PageViewModel>} Our built IntroViewModel.
 */
const checkYourAnswersViewModelBuilder = async (
  request: Request,
  backUrl: string | undefined,
  model: ApplicationModel,
  config: ApplicationConfig,
  error?: Errors,
): Promise<PageViewModel> => {
  const viewModel = await viewModelBuilder(request, backUrl, model, config, error);

  const pageViewModel: PageViewModel = {
    ...viewModel,
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const cachedModel = request.yar.get('applicationModel');
  pageViewModel.applicantName = cachedModel.applicantName;
  pageViewModel.applicantOrganisation = cachedModel.applicantOrganisation;
  pageViewModel.applicantEmailAddress = cachedModel.applicantEmailAddress;
  pageViewModel.applicantPhoneNumber = cachedModel.applicantPhoneNumber;

  pageViewModel.changePersonalDetailsLink = createChangeLink(whatIsYourEmail);

  return pageViewModel;
};
const scloudCheckYourAnswersViewModelBuilder = async (
  request: ScloudRequest,
  backUrl: string | undefined,
  model: ApplicationModel,
  config: ApplicationConfig,
  error?: Errors,
): Promise<PageViewModel> => {
  const get = request.context.sessionGet as <T>(key: string) => Promise<T>;

  const viewModel = await scloudViewModelBuilder(request, backUrl, model, config, error);

  const pageViewModel: PageViewModel = {
    ...viewModel,
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const cachedModel = await get<ApplicationModel>('applicationModel');
  pageViewModel.applicantName = cachedModel.applicantName;
  pageViewModel.applicantOrganisation = cachedModel.applicantOrganisation;
  pageViewModel.applicantEmailAddress = cachedModel.applicantEmailAddress;
  pageViewModel.applicantPhoneNumber = cachedModel.applicantPhoneNumber;

  pageViewModel.changePersonalDetailsLink = createChangeLink(whatIsYourEmail);

  return pageViewModel;
};

export { checkYourAnswersViewModelBuilder, scloudCheckYourAnswersViewModelBuilder };
