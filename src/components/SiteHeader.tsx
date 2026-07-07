export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="wordmark">
          <div className="wordmark-glyph">CH</div>
          <div>
            <div className="wordmark-text">ChainHound</div>
            <div className="wordmark-tag">on-chain investigation agent</div>
          </div>
        </div>
        <div className="chain-pills">
          <span className="chain-pill">ETH</span>
          <span className="chain-pill">BNB</span>
          <span className="chain-pill">POLYGON</span>
          <span className="chain-pill">ARBITRUM</span>
        </div>
      </div>
    </header>
  );
}
