

const MessageList = ({messages}) => {
  return (
    <table>
      <tbody>
        <tr>
          <th>Message</th>
          
        </tr>
        {messages.map((x, i)=>{
          return <tr key={`msg-${i}`}>
            <td>{x}</td>
          </tr>
        })}
      </tbody>
    </table>
  )
}

export default MessageList