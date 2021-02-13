import 'bluebird-global'
import 'jest-extended'
import 'reflect-metadata'

import { RenderService } from './render'

describe('Content Renders', () => {
  const render = new RenderService()

  test('Render text content', () => {
    const content = render.renderText('yoyo')
    expect(content).toEqual({ type: 'text', text: 'yoyo' })
  })

  test('Render image content', () => {
    const content = render.renderImage('image.com/image.png', 'this is image')
    expect(content).toEqual({
      type: 'image',
      image: 'image.com/image.png',
      title: 'this is image'
    })
  })

  test('Render card content', () => {
    const content = render.renderCard(
      'myCard',
      'image.com/image.png',
      'sub',
      render.renderButtonPostback('myPost', 'myPayload'),
      render.renderButtonSay('mySay', 'myMsg'),
      render.renderButtonUrl('myUrl', 'url.com')
    )

    expect(content).toEqual({
      type: 'card',
      title: 'myCard',
      image: 'image.com/image.png',
      subtitle: 'sub',
      actions: [
        {
          action: 'Postback',
          title: 'myPost',
          payload: 'myPayload'
        },
        {
          action: 'Say something',
          title: 'mySay',
          text: 'myMsg'
        },
        {
          action: 'Open URL',
          title: 'myUrl',
          url: 'url.com'
        }
      ]
    })
  })

  test('Render carousel content', () => {
    const content = render.renderCarousel(
      render.renderCard('card1', 'image.com/card1.png', 'myCard1', render.renderButtonPostback('myButton', 'yo')),
      render.renderCard('card2', 'image.com/card2.png', 'myCard2'),
      render.renderCard('card3', 'image.com/card3.png', 'myCard3', render.renderButtonSay('sayButton', 'hey'))
    )

    expect(content).toEqual({
      type: 'carousel',
      items: [
        {
          type: 'card',
          title: 'card1',
          image: 'image.com/card1.png',
          subtitle: 'myCard1',
          actions: [
            {
              action: 'Postback',
              title: 'myButton',
              payload: 'yo'
            }
          ]
        },
        {
          type: 'card',
          title: 'card2',
          image: 'image.com/card2.png',
          subtitle: 'myCard2',
          actions: []
        },
        {
          type: 'card',
          title: 'card3',
          image: 'image.com/card3.png',
          subtitle: 'myCard3',
          actions: [
            {
              action: 'Say something',
              title: 'sayButton',
              text: 'hey'
            }
          ]
        }
      ]
    })
  })

  test('Translate text content', () => {
    const content = render.renderText({ en: 'hello {{user.name}}', fr: 'salut {{user.name}}' })

    const translated = render.renderTranslated(content, 'fr')
    expect(translated.text).toEqual('salut {{user.name}}')
  })

  test('Template text content', () => {
    const content = render.renderText('hello {{user.name}}')

    const templated = render.renderTemplate(content, { user: { name: 'bob' } })
    expect(templated.text).toEqual('hello bob')
  })

  test('Translate then template text content', () => {
    const content = render.renderText({ en: 'hello {{user.name}}', fr: 'salut {{user.name}}' })

    const translated = render.renderTranslated(content, 'fr')
    expect(translated.text).toEqual('salut {{user.name}}')

    const templated = render.renderTemplate(translated, { user: { name: 'bob' } })
    expect(templated.text).toEqual('salut bob')
  })

  test('Render multiple text contents using a pipeline', () => {
    const pipe = render.getPipeline('fr', { user: { name: 'bob', age: 43, pin: 3030 } })

    const text1 = pipe.text({ en: 'hello {{user.name}}', fr: 'salut {{user.name}}' })
    expect(text1.text).toEqual('salut bob')

    const text2 = pipe.text({ en: 'age : {{user.age}}', fr: 'âge : {{user.age}}' })
    expect(text2.text).toEqual('âge : 43')

    const text3 = pipe.text('PIN : {{user.pin}}')
    expect(text3.text).toEqual('PIN : 3030')
  })

  test('Translate then template complex content', () => {
    const content = render.renderCarousel(
      render.renderCard(
        { en: 'Card 1', fr: 'Carte 1' },
        'image.com/card1.png',
        'myCard1 on {{state.time}}',
        render.renderButtonPostback('myButton', 'yo')
      ),
      render.renderCard('card2', 'image.com/card2.png', 'myCard2 for {{state.user}}'),
      render.renderCard(
        'card3',
        'image.com/card3.png',
        'myCard3',
        render.renderButtonSay('sayButton', {
          en: 'hey {{state.user}} it is {{state.time}}',
          fr: 'salute {{state.user}} il est {{state.time}}'
        })
      )
    )

    expect(content).toEqual({
      type: 'carousel',
      items: [
        {
          type: 'card',
          title: { en: 'Card 1', fr: 'Carte 1' },
          image: 'image.com/card1.png',
          subtitle: 'myCard1 on {{state.time}}',
          actions: [{ action: 'Postback', title: 'myButton', payload: 'yo' }]
        },
        {
          type: 'card',
          title: 'card2',
          image: 'image.com/card2.png',
          subtitle: 'myCard2 for {{state.user}}',
          actions: []
        },
        {
          type: 'card',
          title: 'card3',
          image: 'image.com/card3.png',
          subtitle: 'myCard3',
          actions: [
            {
              action: 'Say something',
              title: 'sayButton',
              text: { en: 'hey {{state.user}} it is {{state.time}}', fr: 'salute {{state.user}} il est {{state.time}}' }
            }
          ]
        }
      ]
    })

    const translated = render.renderTranslated(content, 'fr')
    expect(translated).toEqual({
      type: 'carousel',
      items: [
        {
          type: 'card',
          title: 'Carte 1',
          image: 'image.com/card1.png',
          subtitle: 'myCard1 on {{state.time}}',
          actions: [{ action: 'Postback', title: 'myButton', payload: 'yo' }]
        },
        {
          type: 'card',
          title: 'card2',
          image: 'image.com/card2.png',
          subtitle: 'myCard2 for {{state.user}}',
          actions: []
        },
        {
          type: 'card',
          title: 'card3',
          image: 'image.com/card3.png',
          subtitle: 'myCard3',
          actions: [
            { action: 'Say something', title: 'sayButton', text: 'salute {{state.user}} il est {{state.time}}' }
          ]
        }
      ]
    })

    const templated = render.renderTemplate(translated, { state: { time: 223, user: 'bob' } })
    expect(templated).toEqual({
      type: 'carousel',
      items: [
        {
          type: 'card',
          title: 'Carte 1',
          image: 'image.com/card1.png',
          subtitle: 'myCard1 on 223',
          actions: [{ action: 'Postback', title: 'myButton', payload: 'yo' }]
        },
        { type: 'card', title: 'card2', image: 'image.com/card2.png', subtitle: 'myCard2 for bob', actions: [] },
        {
          type: 'card',
          title: 'card3',
          image: 'image.com/card3.png',
          subtitle: 'myCard3',
          actions: [{ action: 'Say something', title: 'sayButton', text: 'salute bob il est 223' }]
        }
      ]
    })
  })
})
