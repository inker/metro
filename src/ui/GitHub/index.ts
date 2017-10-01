import * as alertify from 'alertifyjs'
import delay from 'delay.js'

import { makeLink } from '../../util'
import askUsername from './askUsername'
import askPassword from './askPassword'
import sendToGitHub from './sendToGitHub'

async function githubDialog(json: string): Promise<boolean> {
    const username = await askUsername()
    if (!username) {
        return false
    }
    await delay(0)
    const password = await askPassword()
    if (!password) {
        return false
    }
    alertify.message('Wait...')
    try {
        const pr = await sendToGitHub(json, {
            username,
            password,
        })
        if (!pr) {
            alertify.error('Could not create a pull request')
            alertify.alert('Error', 'You have no permission to create pull requests for this repo')
            return false
        }
        if (pr.url) {
            alertify.alert('Success', `Pull request created (${makeLink(pr.url, 'link', true)})`)
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
        alertify.error('Error')
        return false
    }
}

export default githubDialog
