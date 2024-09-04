import React, { useEffect, useState } from 'react';
import { Avatar, Button, Checkbox, Input, message, Modal, Popover, Radio, Select, Switch, Table, Tooltip } from 'antd';
import type { GetProp, RadioChangeEvent, TableColumnsType, TableProps } from 'antd';
import qs from 'qs';
import { CopyOutlined, EyeOutlined, QuestionCircleOutlined, UserOutlined } from '@ant-design/icons';
import { result } from 'lodash';
import axios from 'axios';
import { deleteProduct, getProductList } from '@/services/y2/api';
import { Response } from 'express';
import { history, useIntl } from '@umijs/max';
import styled from 'styled-components';
type ColumnsType<T> = TableProps<T>['columns'];
type TablePaginationConfig = Exclude<GetProp<TableProps, 'pagination'>, boolean>;

// 表单项商品数据类型
interface DataType {
  key: React.Key;
  imgUrl?: string;
  name?: string;
  price?: number;
  inventory?: number;
  state?: boolean;
  productid: string;
}

// ToolTip内容
const content: React.ReactNode = (
  <>
    <div>·在线商店</div>
    <div>·贴文销售</div>
    <div>·消息中心</div>
    <div>·Google</div>
    <div>·WhatsApp</div>
    <div>·Facebook</div>
    <div>·Telegram</div>
  </>
);

interface TableParams {
  pagination?: TablePaginationConfig;
  sortField?: string;
  sortOrder?: string;
  filters?: Parameters<GetProp<TableProps, 'onChange'>>[1];
}

const getRandomuserParams = (params: TableParams) => ({
  results: params.pagination?.pageSize,
  page: params.pagination?.current,
  ...params,
});

export default function ProductListAjax() {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [shelfModalOpen, setShelfModalOpen] = useState(false); // 新增状态
  const [unshelfModalOpen, setUnshelfModalOpen] = useState(false); // 新增状态
  const [archiveModalOpen, setArchiveModalOpen] = useState(false); // 新增状态

  // 分页器初始参数
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
    },
  });

  // 复制商品模态框
  const [radioValue, setRadioValue] = useState(0);

  // 列表数据
  const [data, setData] = useState<DataType[]>([]);

  // 状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const onChangeSwich = (index: number) => {
    let oldDataItem = data[index];
    let newDataItem = {
      ...oldDataItem,
      state: !oldDataItem.state,
    };
    let newData = [...data];
    newData[index].state = !oldDataItem.state;
    setData(newData);
  };

  // 表头
  const columns: TableColumnsType<DataType> = [
    {
      title: '商品',
      dataIndex: 'name',
      width: 180,
      render: (value, record, index) => (
        <div style={{
          display: 'flex',
          flexWrap: 'nowrap',
          alignContent: 'center',
        }}>
          <Avatar shape="square" size="large" src={record.imgUrl} icon={<UserOutlined />} />
          <span style={{
            marginLeft: 10,
            alignContent: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}>{record.name}</span>
        </div>
      ),
    },
    {
      title: '售价',
      dataIndex: 'price',
      width: 150,
      render: (value, record, index) => {
        let num = Number(value);
        return <>{`US$ ${num.toFixed(2)}`}</>;
      },
    },
    {
      title: '库存数',
      dataIndex: 'inventory',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'state',
      width: 120,
      render: (text, record, index) => (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 9,
          alignContent: 'center',
        }}>
          <Switch style={{
            position: 'relative',
            top: "3px",
          }} size='small' checked={data[index].state} onChange={() => onChangeSwich(index)} />
          <Popover content={content} title="销售渠道" style={{ width: '20px' }} trigger="click">
            <span onClick={(e) => {
              e.preventDefault();
              e.stopPropagation(); // 添加这一行来阻止事件冒泡
            }}>{data[index].state ? '上架' : '下架'}</span>
          </Popover>
        </div>
      ),
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      render: (record) => {
        return (
          <div style={{
            color: '#474f5e',
            fontSize: 20,
            display: 'flex',
          }}>
            <ButtonIcon>
              <div className='wrap'>
                <Tooltip title="预览">
                  <EyeOutlined />
                </Tooltip>
              </div>
            </ButtonIcon>
            <ButtonIcon>
              <Tooltip title="复制">
                <div className='wrap' onClick={() => setModalOpen(true)}>
                  <CopyOutlined />
                </div>
              </Tooltip>
            </ButtonIcon>
          </div>
        );
      },
    },
  ];

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/product/query/${qs.stringify(getRandomuserParams(tableParams))}`)
      .then((res) => res.json())
      .then(({ results }) => {
        setData(results);
        setLoading(false);
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: 200,
          },
        });
      });

    const limit = getRandomuserParams(tableParams).results;
    const page = getRandomuserParams(tableParams).page;
    getProductList(page, limit)
      .then((res) => {
        let newData: DataType[] = [];
        res.data?.forEach((item: any) => {
          newData.push({
            key: item.id,
            imgUrl: item.product_image,
            price: item.price,
            name: item.title,
            state: item.status === 1,
            inventory: item.quantity,
            productid: item.id,
          });
        });
        setData(newData);
        setLoading(false);
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: res.count,
          },
        });
      });
  };

  useEffect(() => {
    fetchData();
  }, [tableParams.pagination?.current, tableParams.pagination?.pageSize]);

  const handleTableChange: TableProps['onChange'] = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      ...sorter,
    });
    if (pagination.pageSize !== tableParams.pagination?.pageSize) {
      setData([]);
    }
  };

  const handleOrderClick = (productId: string) => {
    console.log('Clicked product:', productId);
    history.push(`/products/${productId}/edit`);
  };

  const handleRowSelectionChange = (selectedRowKeys: React.Key[], selectedRows: DataType[]) => {
    setSelectedRowKeys(selectedRowKeys);
    console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
  };
  const SelectedActions = ({ selectedRowKeys, setSelectedRowKeys }: { selectedRowKeys: React.Key[]; setSelectedRowKeys: React.Dispatch<React.SetStateAction<React.Key[]>> }) => {
    const selectedCount = selectedRowKeys.length;
  
    if (selectedCount === 0) return null;
  
    const handleClearSelection = () => {
      setSelectedRowKeys([]);
    };
   
  
      return (
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '20px' }}>
          <Checkbox
            checked={selectedCount > 0}
            onClick={(e) => {
              e.stopPropagation(); // 阻止点击事件冒泡到父元素
              handleClearSelection();
            }}
            style={{ marginLeft: 7 }}
          />
          <span style={{ marginLeft: 20 }}>已选择 {selectedCount} 项</span>
          <div style={{ margin: '10px' }}>
            <Button onClick={() => setShelfModalOpen(true)}>上架</Button>
            <Button style={{ margin: '10px' }} onClick={() => setUnshelfModalOpen(true)}>下架</Button>
              {/* 上架模态框 */}
      <Modal
        centered
        title="确定将商品设置为上架？"
        open={shelfModalOpen}
        onCancel={() => setShelfModalOpen(false)}
      >
       
       已上架的商品会在网店中展示，可供你的客户浏览及购买。
      </Modal>
             {/* 下架模态框 */}
            <Modal
        centered
        title="确定将商品设置为下架？"
        open={unshelfModalOpen}
        onCancel={() => setUnshelfModalOpen(false)}
      >
       
       已下架的商品将在网店中隐藏，无法被客户看到
      </Modal>
       {/* 存档模态框 */}
       <Modal
        centered
        title="是否将商品存档？"
        open={archiveModalOpen}
        onCancel={() => setArchiveModalOpen(false)}
      >
       
       已下架的商品将在网店中隐藏，无法被客户看到
      </Modal>
            <Select
              size='middle'
              defaultValue="批量编辑"
              style={{ width: 120 }}
              listHeight={230}
              options={[
                { value: '修改名称', label: '修改名称' },
                { value: '编辑厂商', label: '编辑厂商' },
                { value: '添加标签', label: '添加标签' },
                { value: '剔除标签', label: '剔除标签' },
                { value: '添加销售渠道', label: '添加销售渠道' },
                { value: '剔除销售渠道', label: '剔除销售渠道' },
                { value: '修改售价', label: '修改售价' },
                { value: '修改原价', label: '修改原价' },
              ]}
            />
            <Button style={{ margin: '10px' }} onClick={() => setArchiveModalOpen(true)}>将商品存档</Button>
            <Button style={{ margin: '10px' }}>进入批量编辑器</Button>
          </div>
        </div>
        
      );
    };

    return (
      <Scoped>
        <SelectedActions selectedRowKeys={selectedRowKeys} setSelectedRowKeys={setSelectedRowKeys} /> {/* 显示选择的数量和操作按钮 */}
        <Table
          columns={columns}
          dataSource={data}
          pagination={tableParams.pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1300 }}
          rowKey={(record) => record.productid}
          onRow={(record) => ({
            onClick: () => {
              console.log('Row clicked:', record);
              handleOrderClick(record.productid);
            },
          })}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys, // 使用状态来记录选中的行
            onChange: handleRowSelectionChange,
          }}
          // 隐藏表头
          showHeader={selectedRowKeys.length === 0}
        />
    
        {/* 复制商品模态框 */}
        <Modal
          centered
          title="复制商品"
          open={modalOpen}
          onOk={() => setModalOpen(false)}
          onCancel={() => setModalOpen(false)}
        >
          <Content>
            <div>商品名称</div>
            <div>
              <Input />
            </div>
            <div>
              <Checkbox className='selectItem'>
                <span style={{
                    marginRight: '3px',
                    display: 'flex',
                    alignContent: 'center',
                    flexWrap: 'nowrap',
                    width: '200px'
                  }}>
                  <span style={{
                    marginRight: '3px',
                  }}>复制商品图片</span>
                  <Tooltip title="prompt text">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </span>
              </Checkbox>
            </div>
            <div>
              <Checkbox>
                <span>复制商品库存</span>
              </Checkbox>
            </div>
    
            <div>商品状态</div>
            <Radio.Group value={radioValue}>
              <div>
                <Radio value={1}>
                  <span>已上架</span>
                </Radio>
              </div>
              <div>
                <Radio value={2}>
                  <span>已下架</span>
                </Radio>
              </div>
            </Radio.Group>
          </Content>
        </Modal>
      </Scoped>
    );
};

const Scoped = styled.div`
  .ant-table-tbody > tr > td {
    padding: 10px; 
  }
`

const ButtonIcon = styled.div`
.wrap{
    height:36px;
    width: 36px;
    display: flex;
    justify-content: center;
    align-content: center;
    border-radius:4px;
    &:hover{
        background-color: rgba(60, 181, 218, 0.114);
        cursor:pointer;
    }
}

`

const Content = styled.div`
  display:flex;
  flex-direction: column;
  gap: 5px;
  span{
  font-size: 14px;
  color: #313131
  }
`