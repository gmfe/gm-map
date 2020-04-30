import Map from '../src/mobile_map'
import React from 'react'
import ReactDOM from 'react-dom'

class App extends React.Component {
  constructor () {
    super()
    this.state = {
      latitude: '31.233462',
      longitude: '121.492156',
      mapAddress: '上海外滩'
    }
  }

  componentDidMount () {
    // setTimeout(() => {
    //   this.setLocation({ address: '上海外滩', longitude: '121.492156', latitude: '31.233462' })
    // }, 2000)
  }

  setLocation = e => {
    console.log(e)
    this.setState({
      longitude: e.longitude,
      latitude: e.latitude,
      mapAddress: e.address
    })
  }

  render () {
    const { longitude, latitude, mapAddress } = this.state
    const center = { location: { longitude, latitude } }
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Map
          amapkey='e805d5ba2ef44393f20bc9176c3821a2'
          onSelect={this.setLocation}
          {...center}
          mapAddress={mapAddress}
        />
      </div>
    )
  }
}

ReactDOM.render(<App/>, document.getElementById('app'))
