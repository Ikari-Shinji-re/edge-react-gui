import '@walletconnect/react-native-compat'

import { SessionTypes } from '@walletconnect/types'
import * as React from 'react'

import { walletConnectPromise } from '../components/services/WalletConnectService'
import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import { useSelector } from '../types/reactRedux'
import { WcConnectionInfo } from '../types/types'
import { getWalletName } from '../util/CurrencyWalletHelpers'
import { unixToLocaleDateTime } from '../util/utils'
import { useHandler } from './useHandler'
import { useWatch } from './useWatch'

interface WalletConnect {
  getActiveSessions: () => Promise<WcConnectionInfo[]>
}

/**
 * Access Wallet Connect
 */
export function useWalletConnect(): WalletConnect {
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')

  // Utils
  const getPublicAddresses = async () => {
    const map = new Map<string, string>()
    for (const walletId of Object.keys(currencyWallets)) {
      const address = await currencyWallets[walletId].getReceiveAddress()
      map.set(address.publicAddress, walletId)
    }
    return map
  }

  const getWalletIdFromSessionNamespace = async (namespaces: SessionTypes.Namespaces): Promise<string | undefined> => {
    const publicAddresses = await getPublicAddresses()
    for (const networkName of Object.keys(namespaces)) {
      const [namespace, reference, address] = namespaces[networkName].accounts[0].split(':')

      const walletId = publicAddresses.get(address)
      if (walletId == null) continue

      const wallet = currencyWallets[walletId]
      if (wallet == null) continue

      const chainId = SPECIAL_CURRENCY_INFO[wallet.currencyInfo.pluginId].walletConnectV2ChainId
      if (chainId == null) continue

      if (chainId.namespace === namespace && chainId.reference === reference) {
        return walletId
      }
    }
  }

  const parseConnection = (session: SessionTypes.Struct, walletId: string): WcConnectionInfo => {
    const icon = session.peer.metadata.icons[0] ?? '.svg'
    const iconUri = icon.endsWith('.svg') ? 'https://content.edge.app/walletConnectLogo.png' : icon
    const { date, time } = unixToLocaleDateTime(session.expiry)
    const expiration = `${date} at ${time}`
    const connection = {
      dAppName: session.peer.metadata.name,
      dAppUrl: session.peer.metadata.url,
      expiration,
      walletName: getWalletName(currencyWallets[walletId]),
      walletId: walletId,
      uri: session.topic,
      icon: iconUri
    }
    return connection
  }

  // API
  const getActiveSessions = useHandler(async () => {
    const client = await walletConnectPromise
    const connections: WcConnectionInfo[] = []
    const sessions = client.getActiveSessions()
    for (const sessionName of Object.keys(sessions)) {
      const session = sessions[sessionName]
      const walletId = await getWalletIdFromSessionNamespace(session.namespaces)
      if (walletId == null) continue

      const connection = parseConnection(session, walletId)
      connections.push(connection)
    }
    return connections
  })

  return React.useMemo(
    () => ({
      getActiveSessions
    }),
    [getActiveSessions]
  )
}
