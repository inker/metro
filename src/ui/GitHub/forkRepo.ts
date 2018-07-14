const alertifyPromise = import(/* webpackChunkName: "alertify" */ 'ui/alertify')

export default async (gh, baseRepo, baseBranch) => {
    const head = `heads/${baseBranch}`
    const ref = await baseRepo.getRef(head)
    const { sha } = ref.data.object
    const alertify = (await alertifyPromise).default
    alertify.message('Forking repo')

    const fork = await baseRepo.fork()
    alertify.message('Repo forked')
    const { owner, name } = fork.data
    const forkedRepo = gh.getRepo(owner.login, name)

    await forkedRepo.updateHead(head, sha, false)
    alertify.message('Head updated')

    return forkedRepo
}
