import * as GitHub from 'github-api'
import * as alertify from 'alertifyjs'
import delay from 'delay.js'

import { makeLink } from '../util'
import { prompt } from './alertify'

const GITHUB_URL = 'https://github.com'
const MY_NAME = 'inker'
const REPO_NAME = 'metro'
const MAIN_BRANCH = 'master'

interface Auth {
    username: string,
    password: string,
}

interface PullRequest {
    repo: any,
    url: string,
    branchName: string,
}

async function sendToGitHub(json: string, { username, password }: Auth): Promise<PullRequest | null> {
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
        return null
    } catch (err) {
        // or create a pull request
        const fork = await repo.fork()
        alertify.message('Repo forked')
        const { owner, name } = fork.data
        const tempRepo = gh.getRepo(owner.login, name)

        const branchName = `branch-${Date.now()}`
        await tempRepo.createBranch('master', branchName)
        alertify.message('Branch created')

        await tempRepo.writeFile(branchName, `res/${city}/graph.json`, json, title, {})
        alertify.message('File written')

        const body = await prompt('What did you change?', null) || title

        const pullRequest = await repo.createPullRequest({
            title,
            head: `${username}:${branchName}`,
            base: MAIN_BRANCH,
            body,
            maintainer_can_modify: false,
        })
        alertify.success('Success')
        return {
            repo,
            url: pullRequest.data.html_url,
            branchName,
        }
    }
}

async function getPullRequest(repo, head: string) {
    try {
        const { data } = await repo.listPullRequests({
            head,
        })
        return data[0].html_url as string
    } catch (err) {
        console.error(err)
        return null
    }
}

async function githubDialog(json: string): Promise<boolean> {
    const username = await prompt(`GitHub username (${makeLink(GITHUB_URL, 'make an account', true)})`, null)
    if (!username) {
        return false
    }
    await delay(0)
    const password = await prompt("Github password (I don't store it anywhere)", null)
    if (!password) {
        return false
    }
    alertify.message('Wait...')
    let pr: PullRequest | null | undefined
    try {
        pr = await sendToGitHub(json, {
            username,
            password,
        })
        if (pr) {
            alertify.alert(`Pull request created (${makeLink(pr.url, 'link', true)})`)
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
            if (pr) {
                const url = await getPullRequest(pr.repo, `${username}:${pr.branchName}`)
                if (url) {
                    alertify.alert(`Pull request already exists (${makeLink(url, 'link', true)})`)
                    return true
                }
            }
        }
        alertify.error('Error')
        return false
    }
}

export default githubDialog
