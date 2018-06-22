import React from 'react';
const { EditorState } = require('draft-js/lib/EditorState')
const { ContentState } = require('draft-js/lib/ContentState')
const Editor = require('draft-js-plugins-editor')
const { convertFromHTML, convertToHTML } = require('draft-convert')
import createRichButtonsPlugin from 'draft-js-richbuttons-plugin'

const richButtonsPlugin = createRichButtonsPlugin();
const {
  // inline buttons
  ItalicButton, BoldButton, UnderlineButton,
  // block buttons
  BlockquoteButton, ULButton, H3Button
} = richButtonsPlugin;

// interface TextEditorProps {
//   text: string;
//   boilerplate: string;
//   handleTextChange: Function;
// }
//
// interface TextEditorState {
//   text: any;
// }

class TextEditor extends React.Component<any, any> {
  constructor(props: any) {
    super(props)

    this.state = {
      text: EditorState.createWithContent(convertFromHTML(this.props.text || ''))
    }
  }

  componentWillReceiveProps(nextProps: any) {
    if (nextProps.boilerplate !== this.props.boilerplate) {
      this.setState({text: EditorState.createWithContent(ContentState.createFromBlockArray(convertFromHTML(nextProps.boilerplate)))},
      () => {
        this.props.handleTextChange(convertToHTML(this.state.text.getCurrentContent()))
      }
    )
    }
  }

  handleTextChange(e: Event) {
    this.setState({text: e}, () => {
      this.props.handleTextChange(convertToHTML(this.state.text.getCurrentContent()).replace(/<p><\/p>/g, '<br/>').replace(/&nbsp;/g, '<br/>'))
    });
  }

  render() {

    return (
      <div className="card is-fullwidth">
        <header className="card-header">
          <div className="myToolbar" style={{margin: '1em'}}>
            <H3Button/>
            <BoldButton/>
            <ItalicButton/>
            <UnderlineButton/>
            <BlockquoteButton/>
            <ULButton/>
          </div>
        </header>
        <div className="card-content">
          <div className="content landing-page-html-editor">
            <Editor editorState={this.state.text} onChange={this.handleTextChange} plugins={[richButtonsPlugin]}/>
          </div>
        </div>
      </div>
    )
  }

}

export { TextEditor }
