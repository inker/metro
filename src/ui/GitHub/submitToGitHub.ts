import GitHub from 'github-api'

import { getCity } from 'utils/misc'
import { makeLink } from 'utils/dom'

import askChanges from './form/askChanges'
import forkRepo from './forkRepo'
import getPullRequest from './getPullRequest'
import { AuthData } from './auth'

const alertifyPromise = import(/* webpackChunkName: "alertify" */ 'ui/alertify')

const MY_NAME = 'metrofan'
const REPO_NAME = 'metronetworks'
const MAIN_BRANCH = 'master'

interface PullRequest {
    repo: any,
    url?: string,
    branchName: string,
}

export default async (json: string, { username, password }: AuthData): Promise<PullRequest | null> => {
    const city = getCity()
    const title = `modify ${city} map`

    const alertify = (await alertifyPromise).default

    const gh = new GitHub({
        username,
        password,
    })

    const repo = gh.getRepo(MY_NAME, REPO_NAME)

    const repoDetails = await repo.getDetails()
    const { permissions } = repoDetails.data
    if (permissions.push) {
        // push directly
        alertify.message('Pushing directly')
        await repo.writeFile(MAIN_BRANCH, `${city}/graph.json`, json, title, {})
        alertify.success('Success')
        return {
            repo,
            branchName: MAIN_BRANCH,
        }
    }

    if (!permissions.pull) {
        return null
    }

    alertify.message('Could not push directly, so forking the repo')

    const changesPromise = askChanges()

    // create a pull request
    const forkedRepo = await forkRepo(gh, repo, MAIN_BRANCH)

    const branchName = `branch-${Date.now()}`
    await forkedRepo.createBranch(MAIN_BRANCH, branchName)
    alertify.message('Branch created')

    await forkedRepo.writeFile(branchName, `${city}/graph.json`, json, title, {})
    alertify.message('File written')

    const body = await changesPromise

    try {
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
    } catch (err) {
        console.error(err)
        const { data } = err.response
        if (data && data.message && data.errors) {
            const errors = `${data.message}. ${data.errors.map(e => e.message).join('. ')}`
            if (errors.includes('pull request already exists')) {
                alertify.warning('Problem with creating a pull request')
                const url = await getPullRequest(repo, `${username}:${branchName}`)
                if (url) {
                    alertify.alert('Warning', `Pull request already exists (${makeLink(url, 'link', true)})`)
                    return {
                        repo,
                        branchName,
                    }
                }
            }
        }
        throw err
    }
}
