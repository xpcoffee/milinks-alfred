import dns from "dns"

export async function resolvesToLink(potentialLink: string): Promise<boolean> {
  const resolution = await new Promise<string[]>(
    (resolve) => dns.resolve(potentialLink, (_err, addresses) => resolve(addresses))
  )

  return resolution.length > 0
}
