import React, { Fragment } from 'react'
import { Map } from 'react-amap'
import SvgClose from '../../svg/close.svg'
import SvgLocation from '../../svg/location.svg'
import TipList from './tip_list'
import './index.less'
import _ from 'lodash'

const INPUT_TIP_URL = 'https://restapi.amap.com/v3/assistant/inputtips'
const SEARCH_URL = 'https://restapi.amap.com/v3/place/around'

// 经纬度合法（兼容字符串/数字）
const isValidLocation = (loc) =>
  !!loc &&
  loc.longitude != null &&
  loc.latitude != null &&
  `${loc.longitude}` !== '' &&
  `${loc.latitude}` !== ''

// 是否同一个点（兼容字符串/数字经纬度）
const isSameLocation = (loc1, loc2) => {
  if (!isValidLocation(loc1) || !isValidLocation(loc2)) return false
  return (
    +loc1.longitude === +loc2.longitude && +loc1.latitude === +loc2.latitude
  )
}

class MobileMap extends React.Component {
  constructor (props) {
    super(props)
    this.mapInstance = null
    // 定位点标记（currentLocation prop 驱动）
    this.currentMarker = null
    // 周边请求序号，用于丢弃过期响应
    this.tipsSeq = 0
    // 搜索位置参考：最近一次外部设置（初始/重新定位）的坐标
    this.anchorLocation = isValidLocation(props.location)
      ? props.location
      : null
    // 地图实例就绪前收到的外部位置更新
    this.pendingLocation = null
    // 与地图实例同源的 AMap 引用：页面可能因定位等能力重复加载 AMap 脚本导致 window.AMap 被替换，
    // 用替换后的 Marker 类往旧地图实例上挂标记会静默失败，故必须以 created 时刻的 AMap 为准
    this.mapAMap = null
    this.mapEvents = {
      created: (m) => {
        this.mapInstance = m
        this.mapAMap = window.AMap
        // 地图实例重建（如搜索浮层显隐导致地图重挂载）时，旧定位点标记随旧实例销毁，需重建
        this.currentMarker = null
        if (this.pendingLocation) {
          const location = this.pendingLocation
          this.pendingLocation = null
          this.relocate(location)
        }
        this.updateCurrentMarker(this.props.currentLocation)
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
    const {
      location: { longitude, latitude }
    } = this.props
    this.getTips(longitude, latitude)
  }

  componentDidUpdate (prevProps) {
    const { location, currentLocation } = this.props
    // location 变化：平滑移动到新位置并刷新周边列表
    if (
      !isSameLocation(prevProps.location, location) &&
      isValidLocation(location)
    ) {
      this.anchorLocation = location
      if (this.mapInstance) {
        this.relocate(location)
      } else {
        this.pendingLocation = location
      }
    }
    this.updateCurrentMarker(currentLocation)
  }

  handleSelect = (item) => {
    const [longitude, latitude] = item.location.split(',')
    const address = `${item.district}${item.name}`

    this.props.onSelect(
      {
        address,
        longitude,
        latitude
      },
      item
    )
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

  handleSearch = (e) => {
    const value = e.target.value
    this.setState({
      inputValue: value
    })
    value && this.debounceSearch(value)
  }

  async getSearchList (value) {
    // 如果是去除前后空格是空值，就不请求接口
    if (!_.trim(value)) {
      return
    }
    const { amapkey, inputTipWithLocation } = this.props
    // 位置参考：优先最近一次定位/初始坐标，无定位时取当前地图中心
    const locationRef = this.anchorLocation || this.state.location
    const locationParam =
      inputTipWithLocation && isValidLocation(locationRef)
        ? `&location=${locationRef.longitude},${locationRef.latitude}`
        : ''
    const data = await window
      .fetch(
        `${INPUT_TIP_URL}?key=${amapkey}&keywords=${value}${locationParam}`
      )
      .then((res) => res.json())
      .catch((err) => {
        console.error(err)
      })
    if (data.status === '1') {
      // 过滤掉不合法的item
      const searchList = _.filter(
        data.tips,
        (item) => typeof item.id === 'string'
      )
      this.setState({
        searchList
      })
    }
  }

  async getTips (lng, lat, syncLocation = true) {
    // 序号用于丢弃过期响应：拖动/定位连续触发时，仅最新一次生效
    const seq = ++this.tipsSeq
    // 周边请求进行中禁止拖动地图，避免请求期间地图又被拖走、结果与视野错位
    this.setDragEnable(false)
    try {
      const location = `${lng},${lat}`
      const data = await window
        .fetch(
          `${SEARCH_URL}?key=${this.props.amapkey}&location=${location}&types=190107|120200`
        )
        .then((res) => res.json())
        .catch((err) => {
          console.error(err)
        })

      if (seq !== this.tipsSeq) {
        return
      }

      const tips = _.map(data && data.pois, (item) => {
        return { ...item, district: item.cityname + item.adname }
      })

      // syncLocation 为 false 时不回写中心，避免 center prop 变化触发 setCenter 跳变、打断 panTo 平滑动画
      this.setState(
        syncLocation
          ? { tips, location: { longitude: lng, latitude: lat } }
          : { tips }
      )
    } finally {
      // 仅最新一次请求负责解锁，避免早先的请求提前解锁
      if (seq === this.tipsSeq) {
        this.setDragEnable(true)
      }
    }
  }

  setDragEnable = (enable) => {
    if (this.mapInstance) {
      this.mapInstance.setStatus({ dragEnable: enable })
    }
  }

  handleTouchEnd = () => {
    setTimeout(() => {
      const { lng, lat } = this.mapInstance.getCenter()
      this.getTips(lng, lat)
    }, 200)
  }

  // 平滑移动到指定位置并刷新周边列表
  relocate = (location) => {
    const target = [+location.longitude, +location.latitude]
    this.mapInstance.panTo(target)
    this.getTips(target[0], target[1], false)
    // 动画结束后同步中心状态：搜索浮层显隐导致地图重挂载时，可用最新视野作为初始中心
    // 注意：远距离 panTo 不走动画、不触发 moveend，需兜底定时器
    let syncDone = false
    const syncCenter = () => {
      if (syncDone) {
        return
      }
      syncDone = true
      if (this.mapInstance) {
        this.mapInstance.off('moveend', syncCenter)
        this.setState({
          location: { longitude: target[0], latitude: target[1] }
        })
      }
    }
    this.mapInstance.on('moveend', syncCenter)
    setTimeout(syncCenter, 800)
  }

  // 定位点标记（蓝点），由 currentLocation prop 驱动
  updateCurrentMarker = (currentLocation) => {
    if (!this.mapInstance) {
      return
    }
    if (!isValidLocation(currentLocation)) {
      if (this.currentMarker) {
        this.currentMarker.setMap(null)
        this.currentMarker = null
      }
      return
    }
    const position = [+currentLocation.longitude, +currentLocation.latitude]
    if (this.currentMarker) {
      this.currentMarker.setPosition(position)
      return
    }
    this.currentMarker = new this.mapAMap.Marker({
      map: this.mapInstance,
      position,
      zIndex: 120,
      anchor: 'center',
      clickable: false,
      content:
        '<div style="width:22px;height:22px;border-radius:50%;background:#1A66FF;border:3px solid #fff;box-shadow:0 0 8px rgba(26,102,255,.6);box-sizing:border-box;"></div>'
    })
  }

  render () {
    const { zoom, amapkey, placeholder, children } = this.props
    const { tips, showSearch, inputValue, searchList, location } = this.state
    // center 必须传稳定引用（state.location 本身）：
    // 若每次渲染新建对象，react-amap 会因引用变化误判 center 改变而 setCenter，
    // 把地图拽回旧中心并打断 panTo 平滑动画
    let center = {}
    if (isValidLocation(location)) {
      center = { center: location }
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
            {inputValue.length ? (
              <SvgClose
                onClick={this.handleCleanInput}
                className='gm-m-map-close'
              />
            ) : null}
            {showSearch && (
              <span
                className='gm-m-map-cancel'
                onClick={this.handleSetShowSearch.bind(this, false)}
              >
                取消
              </span>
            )}
          </div>
        </div>

        {/* 搜索浮层 */}
        {showSearch ? (
          <div className='gm-m-map-search'>
            <TipList handleSelect={this.handleSelect} list={searchList}/>
          </div>
        ) : (
          <Fragment>
            <div className='gm-m-map-amap' onTouchEnd={this.handleTouchEnd}>
              <Map
                version='1.4.6'
                zoom={zoom}
                {...center}
                events={this.mapEvents}
                amapkey={amapkey}
              />
              <SvgLocation className='gm-m-map-location'/>
              {/* 插槽：地图区域内的自定义悬浮层（如定位按钮），自行绝对定位 */}
              {children}
            </div>

            <div className='gm-m-map-bottom'>
              <TipList handleSelect={this.handleSelect} list={tips}/>
            </div>
          </Fragment>
        )}
      </div>
    )
  }
}

MobileMap.defaultProps = {
  zoom: 16,
  placeholder: '小区/写字楼/学校 等'
}

export default MobileMap
