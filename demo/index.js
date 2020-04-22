import Map from '../src/index'
import React from 'react'
import ReactDOM from 'react-dom'

class App extends React.Component {
  constructor () {
    super()
    this.state = {
      longitude: null,
      latitude: null,
      mapAddress: ''
    }
  }

  componentDidMount () {
    setTimeout(() => {
      this.setLocation({ address: '上海外滩', longitude: '121.492156', latitude: '31.233462' })
    }, 2000)
  }

  setLocation = e => {
    console.log(e, 'e')
    this.setState({
      longitude: e.longitude,
      latitude: e.latitude,
      mapAddress: e.address
    })
  }

  render () {
    const { longitude, latitude, mapAddress } = this.state
    const center = longitude && latitude ? { center: { longitude, latitude } } : {}
    return (
      <div style={{ width: '600px', height: '400px' }}>
        <Map
          amapkey='e805d5ba2ef44393f20bc9176c3821a2'
          onGetLocation={this.setLocation}
          {...center}
          mapAddress={mapAddress}
          inputFocusColor='#2c9feb'
          placeholder='请输入...'
          warning
        />
        <button onClick={() => {
          this.setState({ longitude: 112, latitude: 23, mapAddress: '是非得失' })
        }}>点我啊啊啊啊</button>
      </div>
    )
  }
}

ReactDOM.render(<App/>, document.getElementById('app'))
