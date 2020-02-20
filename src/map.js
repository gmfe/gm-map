import React from 'react'
import { Map, Marker } from 'react-amap'
import _ from 'lodash'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import './index.less'

const url = 'https://restapi.amap.com/v3/assistant/inputtips'
const urlRegeo = 'https://restapi.amap.com/v3/geocode/regeo'

class GmMap extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      center: props.center,
      keywords: props.mapAddress,
      tips: [],
      showList: false,
      showWarning: props.warning && props.center === undefined,
      iptFocus: false,
      // 遮罩
      mask: true
    }
    this.iptRef = React.createRef()
    this.hasInitialCenter = !!props.center
    this.useOnGetLocation = false // 是否调用了getLocation
    // map实例
    this.map = null
    this.mapEvents = {
      created: m => {
        this.map = m
        // 处理获取地图实例比获取props.center慢的特殊情况
        if (!this.hasInitialCenter && this.props.center && this.state.center) this.useOnGetLocation = true
      },
      mapmove: () => {
        const center = this.map.getCenter()
        const preCenter = this.state.center
        this.debounceHandleMapMove(center)
        // 只有满足条件才setstate，因为传入Map组件的center是一个对象
        // 检查发现无论这个center的经纬度是否与之前相等，都会导致Map内部去触发mapmove事件，最终导致死循环
        if (!this.hasInitialCenter && !this.useOnGetLocation && this.props.center) return
        if (!preCenter || (preCenter.longitude !== center.lng && preCenter.latitude !== center.lat)) {
          this.setState({
            center: {
              longitude: center.lng,
              latitude: center.lat
            }
          })
        }
      }
    }

    this.debounceHandleMapMove = _.debounce(this.handleMapMove, 80)
    this.debounceGetTips = _.debounce(this.getTips, 80)
  }

  componentDidUpdate (preProps) {
    const { center, mapAddress } = this.props
    const stateCenter = this.state.center
    // 当props的center更新时
    if (center && (!preProps.center || (preProps.center.latitude !== center.latitude || preProps.center.longitude !== center.longitude))) {
      // 性能优化
      const centerDiff = !stateCenter || (stateCenter.latitude !== center.latitude && stateCenter.longitude !== center.longitude)
      if (!this.useOnGetLocation && centerDiff) {
        this.setState({
          center,
          showWarning: false,
          keywords: mapAddress
        })
      }
    }
  }

  handleMapMove = async center => {
    const data = await window.fetch(`${urlRegeo}?key=${this.props.amapkey}&location=${center.lng},${center.lat}`).then(res => res.json()).catch(err => { console.error(err) })
    if (data.status === '1') {
      const keywords = data.regeocode.formatted_address
      this.setState({
        keywords,
        showWarning: false
      })
      this.debounceGetTips(keywords)
      this.props.onGetLocation({
        ...this.state.center,
        address: keywords
      })
      this.useOnGetLocation = true
    }
  }

  async getTips (value) {
    const data = await window.fetch(`${url}?key=${this.props.amapkey}&keywords=${value}`).then(res => res.json()).catch(err => { console.error(err) })
    if (data.status === '1') {
      // 过滤掉不合法的item
      const tips = _.filter(data.tips, item => typeof item.id === 'string')
      this.setState({
        tips
      })
    }
  }

  handleIptBlur = () => {
    const { warning, center } = this.props
    this.setState({
      iptFocus: false,
      showWarning: warning && !this.useOnGetLocation && !center
    })
  }

  handleIptFocus = () => {
    this.setState({ showList: true, showWarning: false, iptFocus: true, mask: false })
  }

  handleInputChange = e => {
    const value = e.target.value
    this.setState({
      keywords: value
    })
    this.debounceGetTips(value)
  }

  handleCleanKeywords = () => { this.setState({ keywords: '', tips: [] }) }

  async handleTipsClick (item) {
    let arr = []
    arr = item.location.split(',')
    this.setState({
      center: {
        longitude: arr[0],
        latitude: arr[1]
      },
      keywords: `${item.district}${item.name}`,
      showList: false
    })
    this.debounceGetTips(`${item.district}${item.name}`)
  }

  handleMask = () => {
    this.setState({
      mask: false
    })
  }

  handleShowWarning = () => {
    this.iptRef.current.focus()
    this.setState({
      showWarning: false
    })
  }

  render () {
    const { keywords, tips, showWarning, iptFocus, center, mask } = this.state
    const { placeholder, inputFocusColor } = this.props
    const mapCenter = center ? { center } : {}
    const markerCenter = center ? { position: center } : {}
    return (
      <div className='gm-map'>
        <div className='gm-map-ipt-wrap'>
          <input
            className={classNames('gm-map-ipt')}
            style={{
              border: iptFocus && inputFocusColor ? `1px solid ${inputFocusColor}` : null
            }}
            type='text'
            placeholder={placeholder}
            value={keywords}
            onFocus={this.handleIptFocus}
            onBlur={this.handleIptBlur}
            onChange={this.handleInputChange}
            ref={this.iptRef}
          />
          {
            keywords && keywords.length
              ? <i
                onClick={this.handleCleanKeywords}
                className={classNames('gm-map-icon', 'xfont', 'xfont-close-circle')}
              />
              : null
          }
        </div>
        <div className='gm-map-amap'>
          <Map
            version='1.4.6'
            zoom={this.props.zoom}
            {...mapCenter}
            events={this.mapEvents}
            amapkey={this.props.amapkey}>
            <Marker
              {...markerCenter}
            />
          </Map>
        </div>
        {this.state.showList && tips.length
          ? <ul className='gm-map-result'>
            {_.map(tips, item => {
              return <li
                className='gm-map-result-item'
                onClick={this.handleTipsClick.bind(this, item)}
                key={`${item.district}${item.name}`}
              >
                <div className='gm-map-result-name'>{item.name}</div>
                <div className='gm-map-result-district'>{`${item.district}${item.address}`}</div>
              </li>
            })}
          </ul>
          : null}
        {showWarning
          ? <div className='gm-map-warning' onClick={this.handleShowWarning}>
            {'(当前地址信息无法获取位置，请重新输入地址或拖动地图至正确位置保存)'}
          </div> : null}
        {mask
          ? <div className='gm-map-mask' onClick={this.handleMask}>
            <div
              className='gm-map-mask-tip'
              style={{ color: inputFocusColor || '#000' }}>
              {'点击解锁后，可拖动修改'}
            </div>
          </div>
          : null
        }
      </div>
    )
  }
}

GmMap.propTypes = {
  center: PropTypes.objectOf(PropTypes.number),
  onGetLocation: PropTypes.func.isRequired,
  zoom: PropTypes.number,
  inputFocusColor: PropTypes.string,
  amapkey: PropTypes.string.isRequired,
  warning: PropTypes.bool,
  placeholder: PropTypes.string,
  mapAddress: PropTypes.string
}

GmMap.defaultProps = {
  zoom: 16
}

export default GmMap
