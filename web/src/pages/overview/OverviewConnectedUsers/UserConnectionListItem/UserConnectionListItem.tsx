import './style.scss';

import dayjs from 'dayjs';
import { floor } from 'lodash-es';
import { useMemo, useState } from 'react';

import SvgIconConnected from '../../../../shared/components/svg/IconConnected';
import IconPacketsIn from '../../../../shared/components/svg/IconPacketsIn';
import IconPacketsOut from '../../../../shared/components/svg/IconPacketsOut';
import SvgIconUserList from '../../../../shared/components/svg/IconUserList';
import SvgIconUserListElement from '../../../../shared/components/svg/IconUserListElement';
import SvgIconUserListExpanded from '../../../../shared/components/svg/IconUserListExpanded';
import { Badge } from '../../../../shared/defguard-ui/components/Layout/Badge/Badge';
import { BadgeStyleVariant } from '../../../../shared/defguard-ui/components/Layout/Badge/types';
import { Button } from '../../../../shared/defguard-ui/components/Layout/Button/Button';
import { ButtonStyleVariant } from '../../../../shared/defguard-ui/components/Layout/Button/types';
import { DeviceAvatar } from '../../../../shared/defguard-ui/components/Layout/DeviceAvatar/DeviceAvatar';
import { NetworkSpeed } from '../../../../shared/defguard-ui/components/Layout/NetworkSpeed/NetworkSpeed';
import { NetworkDirection } from '../../../../shared/defguard-ui/components/Layout/NetworkSpeed/types';
import { UserInitials } from '../../../../shared/defguard-ui/components/Layout/UserInitials/UserInitials';
import { getUserFullName } from '../../../../shared/helpers/getUserFullName';
import { NetworkDeviceStats, NetworkUserStats } from '../../../../shared/types';
import { summarizeDevicesStats } from '../../helpers/stats';
import { NetworkUsageChart } from '../shared/components/NetworkUsageChart/NetworkUsageChart';

interface Props {
  data: NetworkUserStats;
}

export const UserConnectionListItem = ({ data }: Props) => {
  const [expanded, setExpanded] = useState(false);

  const getClassName = useMemo(() => {
    const res = ['user-connection-list-item'];
    if (expanded) {
      res.push('expanded');
    }
    return res.join(' ');
  }, [expanded]);

  return (
    <div className={getClassName}>
      <ExpandButton expanded={expanded} onExpand={() => setExpanded((state) => !state)} />
      <UserRow data={data} />
      {expanded &&
        data.devices.map((device) => <DeviceRow data={device} key={device.id} />)}
    </div>
  );
};

interface UserRowProps {
  data: NetworkUserStats;
}

const UserRow = ({ data }: UserRowProps) => {
  const getOldestDevice = useMemo(() => {
    const rankMap = data.devices.sort((a, b) => {
      const aDate = dayjs.utc(a.connected_at);
      const bDate = dayjs.utc(b.connected_at);
      return aDate.toDate().getTime() - bDate.toDate().getTime();
    });
    return rankMap[0];
  }, [data]);

  const getSummarizedDevicesStat = useMemo(
    () => summarizeDevicesStats(data.devices),
    [data.devices],
  );
  const downloadSummary = getSummarizedDevicesStat.reduce((sum, e) => {
    return sum + e.download;
  }, 0);

  const uploadSummary = getSummarizedDevicesStat.reduce((sum, e) => {
    return sum + e.upload;
  }, 0);

  return (
    <div className="user-row">
      <div className="user-name">
        <UserInitials first_name={data.user.first_name} last_name={data.user.last_name} />
        <span className="full-name">{getUserFullName(data.user)}</span>
      </div>
      <ActiveDevices data={data.devices} />
      <ConnectionTime connectedAt={getOldestDevice.connected_at} />
      <DeviceIps
        wireguardIps={getOldestDevice.wireguard_ips}
        publicIp={getOldestDevice.public_ip}
      />
      <div className="network-usage">
        <div className="network-usage-summary">
          <span className="transfer">
            <IconPacketsIn />
            <NetworkSpeed
              speedValue={downloadSummary}
              direction={NetworkDirection.DOWNLOAD}
              data-testid="download"
            />
          </span>
          <span className="transfer">
            <IconPacketsOut />
            <NetworkSpeed
              speedValue={uploadSummary}
              direction={NetworkDirection.UPLOAD}
              data-testid="upload"
            />
          </span>
        </div>
        <NetworkUsageChart
          data={getSummarizedDevicesStat}
          width={150}
          height={20}
          barSize={2}
        />
      </div>
    </div>
  );
};

interface DeviceRowProps {
  data: NetworkDeviceStats;
}

const DeviceRow = ({ data }: DeviceRowProps) => {
  const downloadSummary = data.stats.reduce((sum, e) => {
    return sum + e.download;
  }, 0);

  const uploadSummary = data.stats.reduce((sum, e) => {
    return sum + e.upload;
  }, 0);

  return (
    <div className="device-row">
      <div className="device-name">
        <SvgIconUserListElement />
        <DeviceAvatar deviceId={data.id} active={true} />
        <span className="name">{data.name}</span>
      </div>
      <div className="col-fill"></div>
      <ConnectionTime connectedAt={data.connected_at} />
      <DeviceIps publicIp={data.public_ip} wireguardIps={data.wireguard_ips} />
      <div className="network-usage">
        <div className="network-usage-summary">
          <span className="transfer">
            <IconPacketsIn />
            <NetworkSpeed
              speedValue={downloadSummary}
              direction={NetworkDirection.DOWNLOAD}
              data-testid="download"
            />
          </span>
          <span className="transfer">
            <IconPacketsOut />
            <NetworkSpeed
              speedValue={uploadSummary}
              direction={NetworkDirection.UPLOAD}
              data-testid="upload"
            />
          </span>
        </div>
        <NetworkUsageChart data={data.stats} width={150} height={20} barSize={2} />
      </div>
    </div>
  );
};

interface ActiveDevicesProps {
  data: NetworkDeviceStats[];
}

const ActiveDevices = ({ data }: ActiveDevicesProps) => {
  const activeDeviceCount = data.length;
  const showCount = useMemo(() => activeDeviceCount > 3, [activeDeviceCount]);
  const getCount = useMemo(() => activeDeviceCount - 2, [activeDeviceCount]);
  const getSliceEnd = useMemo(() => {
    if (activeDeviceCount > 3) {
      return 2;
    }
    return activeDeviceCount;
  }, [activeDeviceCount]);
  return (
    <div className="active-devices">
      {data.slice(0, getSliceEnd).map((device) => (
        <DeviceAvatar active={true} key={device.id} />
      ))}
      {showCount && (
        <div className="count-box">
          <span className="count">+{getCount}</span>
        </div>
      )}
    </div>
  );
};

interface DeviceIpsProps {
  publicIp: string;
  wireguardIps: string[];
}

const DeviceIps = ({ publicIp, wireguardIps }: DeviceIpsProps) => {
  return (
    <div className="device-ips">
      <Badge type={BadgeStyleVariant.STANDARD} text={publicIp} />
      {wireguardIps.map((ip) => (
        <Badge type={BadgeStyleVariant.STANDARD} text={ip} key={ip} />
      ))}
    </div>
  );
};

interface ConnectionTimeProps {
  connectedAt: string;
}

const ConnectionTime = ({ connectedAt }: ConnectionTimeProps) => {
  const getConnectionTime = useMemo(() => {
    const minutes = dayjs().diff(dayjs.utc(connectedAt), 'm');
    if (minutes > 60) {
      const hours = floor(minutes / 60);
      const res = [`${hours}h`];
      if (minutes % 60 > 0) {
        res.push(`${minutes % 60}m`);
      }
      return res.join(' ');
    }
    return `${minutes}m`;
  }, [connectedAt]);
  return (
    <div className="active-time">
      <SvgIconConnected />
      <span className="time">{getConnectionTime}</span>
    </div>
  );
};

interface ExpandButtonProps {
  expanded: boolean;
  onExpand: () => void;
}

const ExpandButton = ({ expanded, onExpand }: ExpandButtonProps) => {
  return (
    <Button
      styleVariant={ButtonStyleVariant.ICON}
      onClick={() => onExpand()}
      className="blank expand-devices"
    >
      {expanded ? <SvgIconUserListExpanded /> : <SvgIconUserList />}
    </Button>
  );
};
