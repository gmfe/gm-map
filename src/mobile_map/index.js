import React, { Fragment } from 'react'
import { Map } from 'react-amap'
import SvgClose from '../../svg/close.svg'
import SvgLocation from '../../svg/location.svg'
import TipList from './tip_list'
import './index.less'
import _ from 'lodash'

const INPUT_TIP_URL = 'https://restapi.amap.com/v3/assistant/inputtips'
const SEARCH_URL = 'https://restapi.amap.com/v3/place/around'

class MobileMap extends React.Component {
  constructor (props) {
    super(props)
    this.mapInstance = null
    this.mapEvents = {
      created: m => {
        this.mapInstance = m
      }
    }

    this.state = {
      tips: [],
      searchList: [],
      showSearch: false,
      inputValue: '',
      location: props.location
    }
    this.debounceSearch = _.debounce(this.getSearchList, 500)
  }

  componentDidMount () {
    const { location: { longitude, latitude } } = this.props
    this.getTips(longitude, latitude)
  }

  handleSelect = (item) => {
    const [longitude, latitude] = item.location.split(',')
    const address = `${item.district}${item.name}`

    this.props.onSelect({
      address,
      longitude,
      latitude
    })
  }

  handleSetShowSearch = (bool) => {
    if (!bool) {
      this.setState({ showSearch: bool, inputValue: '' })
    } else {
      this.setState({ showSearch: bool })
    }
  }

  handleCleanInput = () => {
    this.setState({ inputValue: '' })
  }

  handleSearch = e => {
    const value = e.target.value
    this.setState({
      inputValue: value
    })
    value && this.debounceSearch(value)
  }

  async getSearchList (value) {
    const data = await window.fetch(`${INPUT_TIP_URL}?key=${this.props.amapkey}&keywords=${value}`).then(res => res.json()).catch(err => { console.error(err) })
    if (data.status === '1') {
      // 过滤掉不合法的item
      const searchList = _.filter(data.tips, item => typeof item.id === 'string')
      this.setState({
        searchList
      })
    }
  }

  async getTips (lng, lat) {
    const location = `${lng},${lat}`
    const data = await window.fetch(`${SEARCH_URL}?key=${this.props.amapkey}&location=${location}&types=190107|120200`).then(res => res.json()).catch(err => { console.error(err) })

    const tips = _.map(data.pois, item => {
      return { ...item, district: item.cityname + item.adname }
    })

    this.setState({ tips, location: { longitude: lng, latitude: lat } })
  }

  handleTouchEnd = () => {
    setTimeout(() => {
      const { lng, lat } = this.mapInstance.getCenter()
      this.getTips(lng, lat)
    }, 200)
  }

  render () {
    const { zoom, amapkey, placeholder } = this.props
    const { tips, showSearch, inputValue, searchList, location: { longitude, latitude } } = this.state
    let center = {}
    if (!!latitude && !!longitude) {
      center = { center: { longitude, latitude } }
    }

    return (
      <div className='gm-m-map'>

        <div className='gm-m-map-top'>
          <div className='gm-m-map-input-container'>
            <input
              type='text'
              placeholder={placeholder}
              value={inputValue}
              onChange={this.handleSearch}
              onFocus={this.handleSetShowSearch.bind(this, true)}
            />
            {inputValue.length ? <SvgClose onClick={this.handleCleanInput} className='gm-m-map-close'/> : null}
            {showSearch && <span className='gm-m-map-cancel' onClick={this.handleSetShowSearch.bind(this, false)}>取消</span>}
          </div>
        </div>

        {/* 搜索浮层 */}
        {showSearch
          ? <div className='gm-m-map-search'><TipList handleSelect={this.handleSelect} list={searchList}/></div>
          : <Fragment>
              <div className='gm-m-map-amap' onTouchEnd={this.handleTouchEnd}>
                <Map
                  version='1.4.6'
                  zoom={zoom}
                  {...center}
                  events={this.mapEvents}
                  amapkey={amapkey}
                />
                <SvgLocation className='gm-m-map-location'/>
              </div>

              <div className='gm-m-map-bottom'>
                <TipList handleSelect={this.handleSelect} list={tips}/>
              </div>
        </Fragment>}
      </div>
    )
  }
}

MobileMap.defaultProps = {
  zoom: 16,
  placeholder: '小区/写字楼/学校 等'
}

export default MobileMap
