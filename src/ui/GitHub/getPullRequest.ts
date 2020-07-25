export default async (repo, head: string) => {
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
