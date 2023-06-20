import { EdgeAccount, EdgeContext } from 'edge-core-js'
import { ChangePinScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { connect } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { logActivity } from '../../util/logger'
import { SceneWrapper } from '../common/SceneWrapper'

interface OwnProps extends EdgeSceneProps<'changePin'> {}

interface StateProps {
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
        <ChangePinScreen account={account} context={context} onComplete={handleComplete} />
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
