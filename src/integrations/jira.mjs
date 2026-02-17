import config from "../config.mjs";
import { select } from "@clack/prompts";

function getUrl(endpoint) {
  const url = config.jira.url.endsWith("/")
    ? config.jira.url.slice(0, -1)
    : config.jira.url;
  /* istanbul ignore next -- endpoint always starts with "/" internally */
  return `${url}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
}

function get(endpoint) {
  return fetch(getUrl(endpoint), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.jira.pat}`,
      "Content-Type": "application/json",
    },
  });
}

async function getJiraIssuesInProgress() {
  const endpoint = `/rest/api/2/search?jql=${encodeURI(config.jira.jql)}`;
  const response = await get(endpoint);
  const data = await response.json();
  return data.issues.map((issue) => ({
    key: issue.key,
    type: issue.fields.issuetype.name,
    summary: issue.fields.summary,
  }));
}

export async function getBranchInstructionsFromJira() {
  if (config.jira) {
    const issues = await getJiraIssuesInProgress();
    if (issues.length === 0) {
      return null;
    }

    var relevantIssue;

    if (issues.length > 1) {
      relevantIssue = await select({
        message: "Select the Jira issue you want to work on:",
        options: issues.map((issue) => ({
          value: issue,
          label: `${issue.key}: ${issue.summary}`,
        })),
      });
    } else {
      relevantIssue = issues[0];
    }

    return `Key: ${relevantIssue.key}\nType: ${relevantIssue.type}\nSummary: ${relevantIssue.summary}`;
  }
}
