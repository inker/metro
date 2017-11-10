import delay from 'delay.js'

import askUsername from './form/askUsername'
import askPassword from './form/askPassword'

export interface AuthData {
    username: string,
    password: string,
}

export default async (): Promise<AuthData | null> => {
    const username = await askUsername()
    if (!username) {
        return null
    }
    await delay(0)
    const password = await askPassword()
    if (!password) {
        return null
    }
    return {
        username,
        password,
    }
}
