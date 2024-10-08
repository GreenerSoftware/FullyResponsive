import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { env } from './util';

const client = new SQSClient({});

function messageBody(...messages: (string | null | undefined)[]): string {
  // Collect as much information as we have available about this component
  const segments: (string | undefined)[] = [process.env.PRODUCT, process.env.COMPONENT, new Date().toISOString()];
  const identifier = segments.filter((segment) => segment).join('/');

  // The message to be sent - skip any empty/undefined segments
  const message = messages.filter((m) => m).join(' ');
  return `[${identifier}]\n${message}`;
}

/**
 * Post an FYI to Slack and don't throw any errors;
 * @param message The message to send (if the SLACK_LOG_QUEUE_URL env var is set)
 */
export async function slackLog(...messages: (string | null | undefined)[]): Promise<string | undefined> {
  const body = messageBody(...messages);

  // Log to the console
  console.log(body);

  const queueUrl = env('SLACK_QUEUE_URL', '');
  if (queueUrl) {
    try {
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: body,
      });

      await client.send(command);
    } catch (e) {
      console.error((e as Error).stack);
    }
  }

  return body;
}