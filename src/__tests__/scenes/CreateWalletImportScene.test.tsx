import { describe, expect, it, jest } from '@jest/globals'
import * as React from 'react'
import { Provider } from 'react-redux'
import TestRenderer from 'react-test-renderer'
import { createStore } from 'redux'

import { CreateWalletImportScene } from '../../components/scenes/CreateWalletImportScene'
import { rootReducer } from '../../reducers/RootReducer'
import { RouteProp } from '../../types/routerTypes'
import { fakeNavigation } from '../../util/fake/fakeNavigation'
import { fakeNonce } from '../../util/fake/fakeNonce'

jest.mock('react-native-keyboard-aware-scroll-view', () => {
  const KeyboardAwareScrollView = (blob: { children: React.ReactNode }) => blob.children
  return { KeyboardAwareScrollView }
})

// Jest doesn't like direct SVG imports
jest.mock('../../assets/images/import-key-icon.svg', () => 'ImportKeySvg')

describe('CreateWalletImportScene', () => {
  const nonce = fakeNonce(0)
  const mockState: any = {
    core: {
      account: {
        currencyConfig: {
          bitcoin: {
            importKey: () => {}
          }
        }
      }
    }
  }
  const store = createStore(rootReducer, mockState)

  it('should render with loading props', () => {
    const navigation = fakeNavigation
    const route: RouteProp<'createWalletImport'> = {
      key: `createWalletImport-${nonce()}`,
      name: 'createWalletImport',
      params: {
        createWalletList: [
          {
            key: `create-wallet:bitcoin-bip49-bitcoin`,
            currencyCode: 'BTC',
            displayName: 'Bitcoin',
            pluginId: 'bitcoin',
            walletType: 'wallet:bitcoin-bip49'
          }
        ],
        walletNames: { 'create-wallet:bitcoin-bip49-bitcoin': 'My Bitcoin' },
        fiatCode: 'USD'
      }
    }

    const renderer = TestRenderer.create(
      <Provider store={store}>
        <CreateWalletImportScene navigation={navigation} route={route} />
      </Provider>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
