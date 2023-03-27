# Quiz from Notion Markdown to Notion table

This script transforms a quiz in Notion Markdown format to a Notion table,
to be able to export it as CSV and import it in [Quizzizz](https://quizizz.com/).

## Running locally

### 1. Setup your local project

```sh
# Switch into this project
cd notion-quiz-from-md-to-table/

# Install the dependencies
npm install
```

### 2. Set your environment variables in a `.env` file

```sh
NOTION_KEY=<your-notion-api-key>
NOTION_SOURCE_PAGE_ID=<your-notion-source-page-id>
NOTION_DEST_DATABASE_ID=<your-notion-destination-database-id>
PAGE_SIZE=50
IMAGE_LINK_MESSAGE=Esta pregunta tiene una imagen. Pendiente de añadir el link correspondiente de Google Drive.
TIME_IN_SECONDS=60
```

You can create your Notion API key [here](https://www.notion.com/my-integrations).

### 3. Run code

```sh
node index.js
```

## References
* https://github.com/makenotion/notion-sdk-js/tree/main/examples/database-email-update
* https://developers.notion.com/docs/create-a-notion-integration
