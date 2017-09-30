import * as GitHub from 'github-api'
import * as alertify from 'alertifyjs'
import delay from 'delay.js'

import { prompt } from './alertify'

const MY_NAME = 'inker'
const REPO_NAME = 'metro'
const MAIN_BRANCH = 'master'

interface Auth {
    username: string,
    password: string,
}

async function sendToGitHub(json: string, { username, password }: Auth) {
    const tokens = location.search.match(/city=(\w+)/)
    const city = tokens ? tokens[1] : 'spb'
    const title = `modify ${city} map`

    const gh = new GitHub({
        username,
        password,
    })

    const repo = gh.getRepo(MY_NAME, REPO_NAME)

    try {
        // try committing directly to the repo
        await repo.writeFile(MAIN_BRANCH, `res/${city}/graph.json`, json, title, {})
        alertify.success('Success')
    } catch (err) {
        // or create a pull request
        const fork = await repo.fork()
        alertify.message('Repo forked')
        const { owner, name } = fork.data
        const tempRepo = gh.getRepo(owner.login, name)

        await tempRepo.writeFile(MAIN_BRANCH, `res/${city}/graph.json`, json, title, {})
        alertify.message('File written')

        const pullRequest = await repo.createPullRequest({
            title,
            head: `${username}:${MAIN_BRANCH}`,
            base: MAIN_BRANCH,
            body: title,
            maintainer_can_modify: false,
        })
        alertify.success('Success')
        return pullRequest.data.html_url
    }
}

async function getPullRequest(username: string, password: string) {
    const gh = new GitHub({
        username,
        password,
    })

    const repo = gh.getRepo(MY_NAME, REPO_NAME)
    try {
        const { data } = await repo.listPullRequests({
            head: `${username}:${MAIN_BRANCH}`,
        })
        return data[0].html_url as string
    } catch (err) {
        console.error(err)
        return null
    }
}

async function githubDialog(json: string): Promise<boolean> {
    const username = await prompt('GitHub username', null)
    if (!username) {
        return false
    }
    await delay(0)
    const password = await prompt("Github password (I don't store it anywhere)", null)
    if (!password) {
        return false
    }
    alertify.message('Wait...')

    try {
        const url = await sendToGitHub(json, {
            username,
            password,
        })
        if (url) {
            alertify.alert(`Pull request created (<a href="${url}" target="_blank">link</a>)`)
        }
        return true
    } catch (err) {
        console.error(err)
        const { response } = err
        if (response.status === 401) {
            alertify.dismissAll()
            alertify.error('Incorrect login or password')
            return githubDialog(json)
        }
        const { data } = response
        const errors = `${data.message}. ${data.errors.map(e => e.message).join('. ')}`
        if (errors.includes('pull request already exists')) {
            alertify.warning('Problem with creating a pull request')
            const url = await getPullRequest(username, password)
            if (url) {
                alertify.alert(`Pull request already exists (<a href="${url}" target="_blank">link</a>)`)
                return true
            }
        }
        alertify.error('Error')
        return false
    }
}

export default githubDialog
