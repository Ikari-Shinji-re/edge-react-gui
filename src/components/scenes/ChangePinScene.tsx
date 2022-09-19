import { EdgeAccount, EdgeContext } from 'edge-core-js'
import { ChangePinScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { connect } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { logActivity } from '../../util/logger'
import { SceneWrapper } from '../common/SceneWrapper'

type OwnProps = {
  navigation: NavigationProp<'changePin'>
}
type StateProps = {
  account: EdgeAccount
  context: EdgeContext
}
type Props = StateProps & OwnProps

export class ChangePinComponent extends React.Component<Props> {
  render() {
    const { context, account, navigation } = this.props
    const handleComplete = () => {
      logActivity(`PIN Changed: ${account.username}`)
      navigation.goBack()
    }
    return (
      <SceneWrapper hasTabs={false} background="theme">
        {/* @ts-expect-error */}
        <ChangePinScreen account={account} context={context} onComplete={handleComplete} onCancel={handleComplete} showHeader={false} />
      </SceneWrapper>
    )
  }
}

export const ChangePinScene = connect<StateProps, {}, OwnProps>(
  state => ({
    context: state.core.context,
    account: state.core.account
  }),
  dispatch => ({})
)(ChangePinComponent)