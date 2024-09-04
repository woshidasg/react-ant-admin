import React, { useRef } from 'react';
import { Card, Form, Input } from "antd";
import newStore from '@/store/newStore';
import { ConsoleSqlOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { Editor } from '@tinymce/tinymce-react';

const { TextArea } = Input;

interface Props {
  productDetail: {
    title: string;
    meta_keyword: string;
    meta_description: string;
  };
}

function ProductDataEdit({ productDetail }: Props) {
  const [form] = Form.useForm();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    form.setFieldsValue({ title: newValue });
    // 更新 store 或其他状态管理
    newStore.title = newValue;
  };

  return (
    <Card title="商品信息" className='product-data-card'>
      <Form layout='vertical' className='product-form' form={form}>
        <Form.Item
          name="title"
          label="商品标题"
          initialValue={productDetail.title}
        >
          <Input
            value={productDetail.title}
            onChange={handleTitleChange}
          />
        </Form.Item>
        <Form.Item 
          name="resume"
          label='商品摘要'
          initialValue={productDetail.meta_keyword}
        >
          <TextArea
            showCount
            maxLength={400}
            onBlur={(e) => {
              newStore.resume = e.target.value;
            }}
            style={{ resize: 'none', height: '35px' }}
            value={newStore.resume}
            placeholder='请用简短的文字描述本商品'
          />
        </Form.Item>
        <Form.Item label='商品描述'>
          <Editor
            tinymceScriptSrc='/tinymce/tinymce.min.js'
            licenseKey='gpl'
            initialValue={productDetail.meta_description}
            init={{
              language_url: '/langs/zh_CN.js',
              language: 'zh_CN',
              height: 650,
              min_height: 400,
              menubar: false,
              toolbar_mode: 'wrap',
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'anchor',
                'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime',
                'media', 'table', 'preview', 'wordcount'
              ],
              toolbar:
                'undo redo | blocks fontsize | ' +
                'bold italic strikethrough underline removeformat | forecolor backcolor | ' +
                'alignleft aligncenter alignright alignjustify | ' +
                'lineheight bullist numlist outdent indent | ' +
                'link image imageupload media table | ' +
                'blockquote hr code superscript subscript | fullscreen ',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
              promotion: false
            }}
          />
        </Form.Item>
      </Form>
    </Card>
  );
}

export default observer(ProductDataEdit);