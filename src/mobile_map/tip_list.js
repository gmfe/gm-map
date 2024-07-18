import React from 'react'
import PropTypes from 'prop-types'

TipList.propTypes = {
  list: PropTypes.array.isRequired,
  handleSelect: PropTypes.func.isRequired
}

function TipList ({ list, handleSelect, ...rest }) {
  return (
    <div className='gm-m-map-tips' {...rest}>
      {
        list.map(item => <div
          className='gm-m-map-tips-item'
          key={`${item.id}${item.name}`}
          onClick={handleSelect.bind(null, item)}
        >
          <div className='item-name'>{item.name}</div>
          <div className='item-district'>{`${item.district}${item.address}`}</div>
        </div>)
      }
    </div>
  )
}

export default TipList
