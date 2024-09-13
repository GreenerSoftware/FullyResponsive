
import { Routes } from '@scloud/lambda-api/dist/types';
import { welcomePage } from 'pages/01-welcome/01-welcome.page';
import whatIsYourEmailPage from 'pages/20-personal-details/20-personal-details.page';
import checkYourAnswersAnnualPage from 'pages/100-check-your-answers-annual/100-check-your-answers-annual.page';
import cullSubmittedAnnualPage from 'pages/40-submitted/40-submitted.page';
import { ApplicationConfig } from 'application-config';
import { view } from 'pages/page';
import { listItems } from 'helpers/dynamodb';
import { env } from 'helpers/util';



export function routes(config: ApplicationConfig): Routes {
  const { path: welcomePagePath, scloudHandler: welcomePageHandler } = welcomePage(config);
  const { path: whatIsYourEmailPagePath, scloudHandler: whatIsYourEmailPageHandler } = whatIsYourEmailPage(config);
  const { path: checkYourAnswersAnnualPagePath, scloudHandler: checkYourAnswersAnnualPageHandler } = checkYourAnswersAnnualPage(config);
  const { path: cullSubmittedAnnualPagePath, scloudHandler: cullSubmittedAnnualPageHandler } = cullSubmittedAnnualPage(config);
  return {
    // '/': {
    //   GET: async () => ({
    //     statusCode: 302,
    //     headers: {
    //       Location: '/deer-return/',
    //     },
    //     body: '',
    //   })
    // },
    '/': {
      GET: async () => ({
        statusCode: 302,
        headers: {
          Location: '/deer-return/welcome',
        },
        body: '',
      })
    },
    '/admin': {
      GET: async () => {
        const items = await listItems(env('SUBMISSIONS_TABLE'));
        const rows = items.map((item) => {
          return [
            {
              text: item.id,
            },
            {
              text: item.applicantEmailAddress,
            },
            {
              text: item.applicantOrganisation,
            },
            {
              text: item.applicantPhoneNumber,
            }
          ];
        });
        rows.push([
          {
            text: "item.id",
          },
          {
            text: "item.applicantEmailAddress",
          },
          {
            text: "item.applicantOrganisation",
          },
          {
            text: "item.applicantPhoneNumber",
          }
        ]);
        return view({ statusCode: 200 }, 'admin', { submissions: rows });
      }
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

    [welcomePagePath]: { GET: welcomePageHandler, POST: welcomePageHandler },
    [whatIsYourEmailPagePath]: { GET: whatIsYourEmailPageHandler, POST: whatIsYourEmailPageHandler },
    [checkYourAnswersAnnualPagePath]: { GET: checkYourAnswersAnnualPageHandler, POST: checkYourAnswersAnnualPageHandler },
    [cullSubmittedAnnualPagePath]: { GET: cullSubmittedAnnualPageHandler, POST: cullSubmittedAnnualPageHandler },
  };
};

export default routes;
