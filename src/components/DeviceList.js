const DeviceList = ({devices}) => {
  return (
    <table>
      <tbody>
        <tr>
          <th>Name</th>
          <th>GUID</th>
          <th>Battery</th>
        </tr>
        {devices.map(x=>{
          return <tr key={x.guid}>
            <th>{x.name}</th>
            <th>{x.guid}</th>
            <th>{x.battery}</th>
          </tr>
        })}
      </tbody>
    </table>
  )
}

export default DeviceList