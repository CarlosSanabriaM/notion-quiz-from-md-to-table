/* ================================================================================
  
  Find the official Notion API client @ https://github.com/makenotion/notion-sdk-js/

================================================================================ */

const { Client } = require("@notionhq/client")
const dotenv = require("dotenv")

//region Read config from .env file

dotenv.config()
const notion = new Client({ auth: process.env.NOTION_KEY })
const sourcePageId = process.env.NOTION_SOURCE_PAGE_ID
const destDatabaseId = process.env.NOTION_DEST_DATABASE_ID
const pageSize = process.env.PAGE_SIZE
const imageLinkMessage = process.env.IMAGE_LINK_MESSAGE
const timeInSeconds = parseInt(process.env.TIME_IN_SECONDS)

//endregion

//region Classes

class QuizQuestion {
  questionNumber
  questionText
  options = []
  correctAnswer
  imageLink
}

//endregion

//region Functions

/**
 * Gets all the children blocks of the given block.
 */
async function getAllChildrenBlocks(blockId) {
  let hasNextPage = true
  let startCursor = undefined
  let childrenBlocks = []

  while (hasNextPage) {
    // Get children blocks using pagination
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: startCursor,
      page_size: pageSize,
    })

    // Add children blocks to the list
    childrenBlocks.push.apply(childrenBlocks, response.results)

    // Check if there are more items
    if (response.has_more) {
      startCursor = response.next_cursor
    } else {
      hasNextPage = false
    }
  }

  return childrenBlocks
}

/**
 * Create a {@link QuizQuestion} object from the given numbered list item.
 */
async function createQuizQuestionFromNumberedListItem(questionNumber, blockId, blockContent) {
  const question = new QuizQuestion()

  // Store the question number and text
  question.questionNumber = questionNumber
  question.questionText = blockContent.rich_text[0].text.content

  // Get all children blocks
  const childrenBlocks = await getAllChildrenBlocks(blockId)

  // Loop through each child block (the possible options of the question)
  let i = 0
  for (const child of childrenBlocks) {
    // If the child type is "Numbered list item"
    if (child.type === "numbered_list_item") {
      // Get "Numbered list item" block content
      let numberedListItem = child[child.type]

      // Store the option text in the options list
      question.options[i] = numberedListItem.rich_text[0].text.content

      // The child list item with green background color is the correct option
      if (numberedListItem.color === "green_background") {
        // Store the correct option number
        question.correctAnswer = i + 1 // index starts in 0, so you need to +1
      }

      // Increment the index for numbered list items only
      i++
    }
    // If the child type is "Image"
    else if (child.type === "image") {
      // Include the image link message
      question.imageLink = imageLinkMessage
    }
  }

  // Log question
  console.log(question)

  // Add question to the destination database
  addQuizQuestionToDestDatabase(question)
}

/**
 * Prints to the console the destination database schema.
 */
async function getDestDatabaseSchema() {
  const response = await notion.databases.retrieve({ database_id: destDatabaseId })
  console.log(response)
}

/**
 * Adds a {@link QuizQuestion} to the Notion destination database.
 */
async function addQuizQuestionToDestDatabase(quizQuestion) {
  try {
    await notion.pages.create({
      parent: { database_id: destDatabaseId },
      properties: {
        "Num": {
          "number": quizQuestion.questionNumber,
        },
        "Question Text": {
          title: [
            {
              "text": {
                "content": quizQuestion.questionText,
              },
            },
          ],
        },
        "Question Type": {
          "select": {
            "name": "Multiple Choice", // All questions are "Multiple Choice"
          },
        },
        "Option 1": {
          "rich_text": [
            {
              "text": {
                "content": quizQuestion.options[0],
              },
            },
          ],
        },
        "Option 2": {
          "rich_text": [
            {
              "text": {
                "content": quizQuestion.options[1],
              },
            },
          ],
        },
        "Option 3": {
          "rich_text": [
            {
              "text": {
                "content": quizQuestion.options[2],
              },
            },
          ],
        },
        "Correct Answer": {
          "number": quizQuestion.correctAnswer,
        },
        "Time in seconds": {
          "number": timeInSeconds,
        },
        "Image Link": {
          "url": quizQuestion.imageLink === undefined ? null : quizQuestion.imageLink,
        },
      },
    })
    console.log(`Question ${quizQuestion.questionNumber} successfully added to the destination database.`)
  } catch (error) {
    console.error(`Question ${quizQuestion.questionNumber} could not be added to the destination database.`)
    console.error("Error:", error.body)
  }
}

//endregion

//region Main

/**
 * Loop through each source page child block, and for each one,
 * generate an object with the required info to populate the destination database,
 * and then add that object to the database.
 */
async function main() {
  let numBlock = 0

  // Get all source page children blocks
  const childrenBlocks = await getAllChildrenBlocks(sourcePageId)
  // Loop through each child block
  for (const child of childrenBlocks) {
    // Increment the block number
    numBlock++

    // Log block info
    console.log(numBlock, child.type)

    // If the block type is "Numbered list item"
    if (child.type === "numbered_list_item") {
      // If the block doesn't have children, throw an Exception
      // The block must have the options as children (and can have optional images)
      if (!child.has_children)
        throw new Error(`The question ${numBlock} doesn't have children blocks. Block text: ${child[child.type].rich_text[0].text.content}`)

      // Create a QuizQuestion object with the block info and add it to the list of questions
      createQuizQuestionFromNumberedListItem(numBlock, child.id, child[child.type])
    }
  }

  console.log(`\nTotal number of quiz questions: ${numBlock}\n`)
}

// getDestDatabaseSchema() // Uncomment to see the destination database schema
main()
//endregion
