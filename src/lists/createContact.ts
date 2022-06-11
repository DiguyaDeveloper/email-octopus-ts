import axios from "axios";
import { EmailOctopusError } from "src/errors/EmailOctopusError";
import { MemberExistsWithEmailAddress } from "src/errors/MemberExistsWithEmailAddress";
import { handleApiGlobalErrors } from "src/handlers/apiGlobalErrorHandler";
import { ApiWideErrorResponses, Contact } from "src/types";

type CreateContactProps = {
  listId: string;
  emailAddress: string;
  fields?: Record<string, unknown>;
  tags?: Array<string>;
  status?: "SUBSCRIBED" | "UNSUBSCRIBED" | "PENDING";
};

type CreateContactErrorResponse = {
  code: "MEMBER_EXISTS_WITH_EMAIL_ADDRESS";
  message: string;
};

export const createContact =
  (apiKey: string) =>
  async (props: CreateContactProps): Promise<Contact> => {
    try {
      const response = await axios.post<Contact>(
        `https://emailoctopus.com/api/1.6/lists/${props.listId}/contacts`,
        {
          api_key: apiKey,
          email_address: props.emailAddress,
          ...(props.fields && { fields: props.fields }),
          ...(props.tags && { tags: props.tags }),
          ...(props.status && { status: props.status }),
        },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData = error.response?.data as
          | ApiWideErrorResponses
          | CreateContactErrorResponse;
        if (errorData.code === "MEMBER_EXISTS_WITH_EMAIL_ADDRESS") {
          throw new MemberExistsWithEmailAddress();
        }
        handleApiGlobalErrors(error, errorData);
      }
      throw new EmailOctopusError();
    }
  };
