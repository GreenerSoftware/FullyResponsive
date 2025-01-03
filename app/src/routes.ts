
import { Routes } from '@scloud/lambda-api/dist/types';
import { welcomePage } from 'pages/01-welcome/01-welcome.page';
import whatIsYourEmailPage from 'pages/20-personal-details/20-personal-details.page';
import checkYourAnswersAnnualPage from 'pages/100-check-your-answers-annual/100-check-your-answers-annual.page';
import cullSubmittedAnnualPage from 'pages/40-submitted/40-submitted.page';
import { ApplicationConfig } from 'application-config';
import { view } from 'pages/page';
import { listItems, putItem } from 'helpers/dynamodb';
import { env, random } from 'helpers/util';

async function admin() {
  const items = await listItems(env('SUBMISSIONS_TABLE'));
  const rows = items
    .sort((a, b) => {
      return b.timestamp.localeCompare(a.timestamp);
    })
    .map((item) => {
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
  return view({ statusCode: 200 }, 'admin', { submissions: rows.slice(0, 10), total: items.length, overflow: items.slice(10).length });
}


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
    //       Location: '/haggis-return/',
    //     },
    //     body: '',
    //   })
    // },
    '/': {
      GET: async () => ({
        statusCode: 302,
        headers: {
          Location: '/haggis-return/welcome',
        },
        body: '',
      })
    },
    '/admin': {
      GET: admin, POST: admin,
    },
    '/haggis-api/v1/returns/property-return': {
      POST: async (request) => {
        const id = `${random()}${random()}`;
        const timestamp = new Date().toISOString();
        const model = request.body;
        try {
          await putItem(env('SUBMISSIONS_TABLE'), { ...model, id, timestamp });
          return {
            statusCode: 200,
            body: {
              id,
              timestamp,
            }
          };
        } catch (e) {
          return {
            statusCode: 500,
            body: {
              error: (e as Error).message,
            }
          };
        }

      },
    },

    '/haggis-return/health': {
      GET: async () => ({
        statusCode: 200,
        body: { message: 'OK' },
      })
    },

    '/haggis-return': {
      GET: async () => ({
        statusCode: 302,
        headers: {
          Location: '/haggis-return/submit',
        },
        body: '',
      })
    },
    '/haggis-return/': {
      GET: async () => ({
        statusCode: 302,
        headers: {
          Location: '/haggis-return/submit',
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
