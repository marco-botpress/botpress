import { Button } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { LegacyIntentDefinition, NewLegacyIntentDefinition } from '../../../backend/typings'
import { makeApiClient } from '../api-client'
import style from '../style.scss'

import { IntentEditor } from './FullEditor'
import IntentDropdown from './IntentDropdown'
import NameModal from './NameModal'

interface IntentParams {
  intentName: string
}

interface Props {
  bp: any
  contentLang: string
  forceSave: boolean
  topicName: string
  params: IntentParams
  updateParams: (params: IntentParams) => void
  setKeepSidebarOpen: (isOpen: boolean) => void
}

export const sanitizeName = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s|\t|\n/g, '-')
    .replace(/[^a-z0-9-_.]/g, '')

export const LiteEditor: FC<Props> = props => {
  const [intents, setIntents] = useState<LegacyIntentDefinition[]>([])
  const [currentIntent, setCurrentIntent] = useState(props.params.intentName)
  const [isModalOpen, setModalOpen] = useState(false)
  const [dirtyIntents, setDirtyIntents] = useState([])

  const api = makeApiClient(props.bp)

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    loadIntents()
  }, [])

  useEffect(() => {
    setDirtyIntents([])
  }, [isModalOpen])

  const loadIntents = async () => {
    setIntents(await api.fetchIntents())
  }

  const createIntent = async (sanitizedName: string, rawName: string) => {
    const intentDef: NewLegacyIntentDefinition = {
      name: sanitizedName,
      contexts: [props.topicName || 'global'],
      utterances: { [props.contentLang]: [rawName] },
      slots: []
    }

    props.updateParams({ intentName: sanitizedName })
    await api.createIntent(intentDef)
    await loadIntents()

    setCurrentIntent(sanitizedName)
  }

  const onIntentChanged = async intent => {
    if (intent) {
      setDirtyIntents([...dirtyIntents, currentIntent])
      setCurrentIntent(intent.name)
      props.updateParams({ intentName: intent.name })
    }
  }

  const toggleModal = () => {
    props.setKeepSidebarOpen(!isModalOpen)
    setModalOpen(!isModalOpen)
  }

  return (
    <div>
      <NameModal
        isOpen={isModalOpen}
        toggle={toggleModal}
        intents={intents}
        onSubmit={createIntent}
        title={lang.tr('module.nlu.intents.createLabel')}
      />
      {currentIntent && (
        <IntentEditor
          liteEditor
          intent={currentIntent}
          api={api}
          contentLang={props.contentLang}
          axios={props.bp.axios} // to be removed for api, requires a lot of refactoring
        />
      )}

      <span className={style.chooseLabel}>{lang.tr('module.nlu.intents.chooseContainerLabel')}</span>
      <Button className={style.createBtn} text={lang.tr('module.nlu.intents.createLabel')} onClick={toggleModal} />
      <IntentDropdown intents={intents} currentIntent={currentIntent} onChange={onIntentChanged} />
    </div>
  )
}
