import * as GitHub from 'github-api'
import * as alertify from 'alertifyjs'
import delay from 'delay.js'

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

function githubDialog(json, resolve, reject) {
  alertify.prompt('GitHub username', null, async (_1, username: string) => {
    await delay(0)
    alertify.prompt('Github password', null, (_2, password: string) => {
      alertify.message('Wait...')
      sendToGitHub(json, {
          username,
          password,
      }).then(url => {
          if (url) {
            alertify.alert(`Pull request created (<a href="${url}" target="_blank">link</a>)`)
          }
          resolve()
      }).catch(err => {
          alertify.dismissAll()
          const { response } = err
          if (response.status === 401) {
              alertify.error('Incorrect login or password')
              githubDialog(json, resolve, reject)
              return
          }
          const { data } = response
          const errors = `${data.message}. ${data.errors.map(e => e.message).join('. ')}`
          if (errors.includes('pull request already exists')) {
              alertify.alert(errors)
              return
          }
          alertify.error()
          reject(err)
      })
    }, reject)
  }, reject)
}

export default (json: string) =>
  new Promise<void>((resolve, reject) => {
      githubDialog(json, resolve, reject)
  })
