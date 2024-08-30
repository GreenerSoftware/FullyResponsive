
import { Routes } from '@scloud/lambda-api/dist/types';
import { welcomePage } from 'pages/01-welcome/01-welcome.page';
import whatIsYourEmailPage from 'pages/20-personal-details/20-personal-details.page';
import checkYourAnswersAnnualPage from 'pages/100-check-your-answers-annual/100-check-your-answers-annual.page';
import cullSubmittedAnnualPage from 'pages/40-submitted/40-submitted.page';
import { ApplicationConfig } from 'application-config';



export function routes(config: ApplicationConfig): Routes {
  const { path: welcomePagePath, scloudHandler: welcomePageHandler } = welcomePage(config);
  const { path: whatIsYourEmailPagePath, scloudHandler: whatIsYourEmailPageHandler } = whatIsYourEmailPage(config);
  const { path: checkYourAnswersAnnualPagePath, scloudHandler: checkYourAnswersAnnualPageHandler } = checkYourAnswersAnnualPage(config);
  const { path: cullSubmittedAnnualPagePath, scloudHandler: cullSubmittedAnnualPageHandler } = cullSubmittedAnnualPage(config);
  return {
    '/': {
      GET: async () => ({
        statusCode: 302,
        headers: {
          Location: '/deer-return/',
        },
        body: '',
      })
    },

    '/deer-return/health': {
      GET: async () => ({
        statusCode: 200,
        body: { message: 'OK' },
      })
    },

    '/deer-return': {
      GET: async () => ({
        statusCode: 302,
        headers: {
          Location: '/deer-return/submit',
        },
        body: '',
      })
    },
    '/deer-return/': {
      GET: async () => ({
        statusCode: 302,
        headers: {
          Location: '/deer-return/submit',
        },
        body: '',
      })
    },

    [welcomePagePath]: { GET: welcomePageHandler },
    [whatIsYourEmailPagePath]: { GET: whatIsYourEmailPageHandler },
    [checkYourAnswersAnnualPagePath]: { GET: checkYourAnswersAnnualPageHandler },
    [cullSubmittedAnnualPagePath]: { GET: cullSubmittedAnnualPageHandler },
  };
};

export default routes;
